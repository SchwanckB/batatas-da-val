import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApp } from "@/components/admin/AdminApp";
import { currentSession } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Painel • Batatas da Val" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Segunda camada de proteção (além do middleware).
  const session = await currentSession();
  if (!session) redirect("/admin/login");
  return <AdminApp session={{ name: session.name, login: session.login, role: session.role }} />;
}
