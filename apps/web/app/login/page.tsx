import { LoginForm } from "@/components/auth/LoginForm";

/**
 * The door.
 *
 * Outside the `(app)` group on purpose: no dock, because there is
 * nowhere to navigate to yet, and a nav bar in front of someone who
 * cannot use it is furniture. Warm paper and nothing else behind it,
 * which is the same page everything else is printed on.
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
 */
export const metadata = {
  title: "Eva & Adam",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-16">
      <p className="type-micro text-mute">Two cities, one book</p>
      <h1 className="type-masthead mt-3 text-ink">
        Eva <span aria-hidden="true">&amp;</span>
        <span className="sr-only">and</span> Adam
      </h1>

      <div className="flex flex-1 items-center justify-center">
        <LoginForm />
      </div>
    </main>
  );
}
