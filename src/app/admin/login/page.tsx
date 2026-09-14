import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdmin } from "@/lib/auth";

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="admin-theme flex min-h-screen items-center justify-center bg-[#090d17] px-4">
      <AdminLoginForm />
    </main>
  );
}
