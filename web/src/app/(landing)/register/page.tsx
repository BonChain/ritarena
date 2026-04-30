import { redirect } from "next/navigation";

// Registration is now inline on /play — anyone landing here from a bookmark
// or the previous flow continues straight into the new combined Register&Play
// experience.
export default function RegisterRedirect(): never {
  redirect("/play");
}
