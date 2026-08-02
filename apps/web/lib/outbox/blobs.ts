/**
 * Where the pending bytes live: the origin-private filesystem.
 *
 * A curated backlog is ~300 photographs, which is a few hundred megabytes of
 * blobs sitting in the queue before a single one has been uploaded. OPFS is
 * built for exactly that — the bytes stay on disk instead of being marshalled
 * through the main thread as structured-clone payloads, which is what makes
 * the difference on a phone.
 *
 * OPFS is supported on Safari. It is routinely confused with the File System
 * Access API — `showOpenFilePicker` and friends — which genuinely is not, and
 * that confusion is the reason this looked impossible for longer than it was.
 *
 * The two write paths below are both real and both needed. `createWritable()`
 * is the modern one. Older Safari exposes only `createSyncAccessHandle()`, and
 * only usefully off the main thread — so on those versions writes go through
 * the sync handle, which works on the main thread in the versions that matter
 * here but is the reason this module keeps its surface to five methods: it has
 * to be movable into a worker without changing a caller.
 */

/** The small surface the queue needs. Two implementations: OPFS, and a test double. */
export interface BlobStore {
  put(key: string, data: Blob): Promise<void>;
  get(key: string): Promise<Blob | null>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  /** Total bytes held. Surfaced so the batch screen can say what is pending. */
  totalBytes(): Promise<number>;
}

/** Raised when the device gives us nowhere durable to put the bytes. */
export class NoDurableStorageError extends Error {
  constructor(reason: string) {
    super(
      `This device did not provide durable storage for pending photographs (${reason}). ` +
        "Nothing was queued, so nothing can be lost — but the upload cannot start.",
    );
    this.name = "NoDurableStorageError";
  }
}

const OUTBOX_DIRECTORY = "outbox";

function opfsRoot(): Promise<FileSystemDirectoryHandle> {
  const storage = globalThis.navigator?.storage;
  if (!storage?.getDirectory) {
    return Promise.reject(
      new NoDurableStorageError("navigator.storage.getDirectory is unavailable"),
    );
  }
  return storage.getDirectory();
}

/**
 * Ask the browser not to evict us.
 *
 * Best-effort and deliberately unenforced: a refusal is not a reason to stop.
 * It changes the odds that a pending batch survives a low-storage moment, and
 * nothing else in this module depends on the answer.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    const storage = globalThis.navigator?.storage;
    if (!storage?.persist) return false;
    if (await storage.persisted?.()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

interface SyncAccessHandle {
  write(buffer: ArrayBufferView, options?: { at?: number }): number;
  truncate(size: number): void;
  flush(): void;
  close(): void;
}

async function writeFile(
  handle: FileSystemFileHandle,
  data: Blob,
): Promise<void> {
  const withWritable = handle as FileSystemFileHandle & {
    createWritable?: () => Promise<FileSystemWritableFileStream>;
    createSyncAccessHandle?: () => Promise<SyncAccessHandle>;
  };

  if (typeof withWritable.createWritable === "function") {
    const stream = await withWritable.createWritable();
    try {
      await stream.write(data);
    } finally {
      await stream.close();
    }
    return;
  }

  if (typeof withWritable.createSyncAccessHandle === "function") {
    const access = await withWritable.createSyncAccessHandle();
    try {
      const bytes = new Uint8Array(await data.arrayBuffer());
      access.truncate(0);
      access.write(bytes, { at: 0 });
      access.flush();
    } finally {
      access.close();
    }
    return;
  }

  throw new NoDurableStorageError("no OPFS write path is exposed");
}

/** The real store. */
export function createOpfsBlobStore(): BlobStore {
  let directory: Promise<FileSystemDirectoryHandle> | null = null;

  const dir = (): Promise<FileSystemDirectoryHandle> => {
    directory ??= opfsRoot().then((root) =>
      root.getDirectoryHandle(OUTBOX_DIRECTORY, { create: true }),
    );
    return directory;
  };

  const listEntries = async (): Promise<[string, FileSystemFileHandle][]> => {
    const handle = (await dir()) as FileSystemDirectoryHandle & {
      entries?: () => AsyncIterableIterator<[string, FileSystemHandle]>;
    };
    if (typeof handle.entries !== "function") return [];
    const out: [string, FileSystemFileHandle][] = [];
    for await (const [name, child] of handle.entries()) {
      if (child.kind === "file") out.push([name, child as FileSystemFileHandle]);
    }
    return out;
  };

  return {
    async put(key, data) {
      const file = await (await dir()).getFileHandle(key, { create: true });
      await writeFile(file, data);
    },

    async get(key) {
      try {
        const file = await (await dir()).getFileHandle(key);
        return await file.getFile();
      } catch {
        // A missing blob is a real, recoverable state — eviction happens. The
        // record survives, so the surface can still name the item and say what
        // became of it rather than the row silently vanishing.
        return null;
      }
    },

    async delete(key) {
      try {
        await (await dir()).removeEntry(key);
      } catch {
        // Already gone is the outcome we wanted.
      }
    },

    async keys() {
      return (await listEntries()).map(([name]) => name);
    },

    async totalBytes() {
      let total = 0;
      for (const [, handle] of await listEntries()) {
        total += (await handle.getFile()).size;
      }
      return total;
    },
  };
}
