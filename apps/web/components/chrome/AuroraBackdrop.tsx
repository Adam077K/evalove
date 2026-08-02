/**
 * The sky between two cities — the app's fixed atmosphere.
 *
 * Three blobs, one per hue: rose over the top-left (Eva), amber off
 * the right edge (Adam), violet low in the middle (the two of them).
 * They drift on 26–38s loops, far below the threshold of attention.
 * Fixed and pointer-transparent; nothing here ever repaints with
 * scroll. Reduced motion stills the drift and keeps the colour.
 */
export function AuroraBackdrop() {
  return (
    <div aria-hidden="true" className="aurora-layer">
      <div
        className="aurora-blob"
        style={{
          top: "-18%",
          left: "-22%",
          width: "62vw",
          height: "62vw",
          minWidth: 380,
          minHeight: 380,
          background: "var(--aur-rose)",
          animation: "drift-a 26s var(--ease-io) infinite",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          top: "22%",
          right: "-26%",
          width: "56vw",
          height: "56vw",
          minWidth: 340,
          minHeight: 340,
          background: "var(--aur-amber)",
          animation: "drift-b 34s var(--ease-io) infinite",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          bottom: "-24%",
          left: "14%",
          width: "64vw",
          height: "64vw",
          minWidth: 400,
          minHeight: 400,
          background: "var(--aur-violet)",
          animation: "drift-c 38s var(--ease-io) infinite",
        }}
      />
    </div>
  );
}
