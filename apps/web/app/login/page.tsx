import { Paper } from "@/components/materials";
import { LoginForm } from "@/components/auth/LoginForm";

/**
 * The door.
 *
 * Outside the `(app)` group on purpose: no dock, because there is
 * nowhere to navigate to yet, and a nav bar in front of someone who
 * cannot use it is furniture. Warm paper and nothing else behind it,
 * which is the same page everything else is printed on — literally
 * `<Paper>` now, the same coldpress stock Today and The Book sit on,
 * rather than `--canvas-base`'s flat fill standing in for it.
 *
 * The wordmark is set edge to edge, which is the one structural idea
 * taken wholesale from the SORDJATI reference: a masthead at a size
 * nothing else on the page competes with, against 11px meta and
 * nothing in between. It is here because this screen is the app's
 * only surface that can never hold a photograph, so it is the exact
 * place the Tuesday test is hardest — and until this, it was a
 * password field floating in an empty page.
 *
 * The ampersand is doing real work: two names, one object. Eva's is
 * first, here and everywhere.
 *
 * No copy explains what this app is. Two people use it and both of
 * them know.
 *
 * THE NIGHT CITY, added below the tagline. "Two cities, one book" sat
 * above a page that showed neither city, and the independent design
 * audit called it exactly: this is the one screen where the DECO
 * half of the language pays for itself immediately, and where it was
 * missing entirely — night mode was a flat dimmed wash with no window
 * at all. The two shores (the same plates Today already uses) sit in
 * a small night-sky band, opacity driven by `--lamp-dim` so it is
 * true DECO — it exists because of what it is (the distance, at
 * night), not because the hour selected it (§1's governing rule) —
 * and it is INVISIBLE BY DAY. The day composition is untouched: the
 * SORDJATI-derived spareness this file already defends is real by
 * daylight, and stays real. The gap this fills was symmetrical
 * (roughly equal empty space above and below the form); the band is
 * a sibling of the form inside the same centred flex column, so the
 * two of them are centred together and the day-mode whitespace either
 * side is unchanged in kind, only in amount.
 */
export const metadata = {
  title: "Eva & Adam",
};

export default function LoginPage() {
  return (
    <Paper stock="coldpress" className="min-h-[100dvh]">
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-16">
        <p className="type-micro text-mute">Two cities, one book</p>
        <h1 className="type-masthead mt-3 text-ink">
          Eva <span aria-hidden="true">&amp;</span>
          <span className="sr-only">and</span> Adam
        </h1>

        <div className="flex flex-1 flex-col items-center justify-center gap-10">
          {/* The night city — DECO, "the distance between them." See
              the file comment: invisible by day via --lamp-dim, the
              one place this screen's tagline is literally true. */}
          <div
            aria-hidden="true"
            className="relative h-32 w-full max-w-xs overflow-hidden rounded-[3px] bg-night-sky"
            style={{ opacity: "var(--lamp-dim, 0)" }}
          >
            <img
              src="/materials/deco-nyc-shore.webp"
              alt=""
              aria-hidden="true"
              width={640}
              height={638}
              className="absolute -bottom-6 -left-3 w-[54%] max-w-none"
            />
            <img
              src="/materials/deco-tlv-shore.webp"
              alt=""
              aria-hidden="true"
              width={724}
              height={525}
              className="absolute -bottom-3 -right-4 w-[50%] max-w-none"
            />
          </div>
          <LoginForm />
        </div>
      </main>
    </Paper>
  );
}
