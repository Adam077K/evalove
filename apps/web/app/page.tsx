import { redirect } from "next/navigation";

/** The app opens on Today. There is no marketing surface — two users, forever. */
export default function Root() {
  redirect("/today");
}
