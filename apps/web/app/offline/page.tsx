/**
 * Offline shell — served by the service worker when a navigation fails.
 *
 * PRIVACY REQUIREMENT: this page contains no personal content. No photograph,
 * no caption, no name, no reference to either person. It is chrome only.
 *
 * Why it looks like this:
 *   §4.4 of the product vision says nothing is ever consumed — the last thing
 *   left stays up until replaced. So the service worker's CacheFirst rules on
 *   /p/{id}/display.jpg and /p/{id}/thumb.jpg already surface the last-seen content
 *   through the cached image responses. This page provides the shell (layout,
 *   navigation) around them; the content arrives from the image cache, not from
 *   this page.
 *
 *   "The outage degrades to 'yesterday's lamp is still on'" — that is designed
 *   behaviour, and this shell is the frame that lamp sits in.
 */

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        {/*
         * A simple waveform mark — abstract, not personal. The specific icon
         * intentionally avoids wifi symbols (which imply "the wifi is off,
         * turn it on") in favour of something that reads as "the signal is
         * here, just quiet right now".
         */}
        <svg
          aria-hidden="true"
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-mute"
        >
          <rect x="4" y="20" width="4" height="8" rx="2" fill="currentColor" opacity="0.4" />
          <rect x="12" y="14" width="4" height="20" rx="2" fill="currentColor" opacity="0.55" />
          <rect x="20" y="8" width="4" height="32" rx="2" fill="currentColor" opacity="0.7" />
          <rect x="28" y="14" width="4" height="20" rx="2" fill="currentColor" opacity="0.55" />
          <rect x="36" y="20" width="4" height="8" rx="2" fill="currentColor" opacity="0.4" />
        </svg>

        <p className="type-label text-mute">No connection right now</p>
      </div>

      <p className="max-w-xs text-sm leading-relaxed text-mute">
        What was here before is still here. Check back when you have a signal.
      </p>
    </div>
  );
}
