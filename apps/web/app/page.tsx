import { redirect } from "next/navigation";

/** The app opens on Home. There is no marketing surface — two users, forever. */
export default function Root() {
  redirect("/home");
}
