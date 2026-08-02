import { AuroraBackdrop } from "@/components/chrome/AuroraBackdrop";
import { LoginForm } from "@/components/auth/LoginForm";

/**
 * The door.
 *
 * Outside the `(app)` group on purpose: no dock, because there is
 * nowhere to navigate to yet, and a nav bar in front of someone who
 * cannot use it is furniture. The aurora is still here — the door
 * belongs to the same evening as everything behind it.
 *
 * No copy explains what this app is. Two people use it and both of
 * them know.
 */
export const metadata = {
  title: "Eva & Adam",
};

export default function LoginPage() {
  return (
    <>
      <AuroraBackdrop />
      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-5 py-16">
        <LoginForm />
      </main>
    </>
  );
}
