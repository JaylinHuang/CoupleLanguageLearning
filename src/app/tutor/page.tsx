import { redirect } from "next/navigation";
import { requireTutor } from "@/app/actions/auth";

/** Tutor 入口：过渡期重定向到原 admin 工具 */
export default async function TutorHomePage() {
  await requireTutor();
  redirect("/admin");
}
