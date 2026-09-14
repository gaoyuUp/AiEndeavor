import { AdminToastProvider } from "@/components/admin-toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminToastProvider>{children}</AdminToastProvider>;
}
