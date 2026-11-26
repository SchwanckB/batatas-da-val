import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { authConfigured } from "@/lib/auth/session";
import { loginAvailable } from "@/lib/server/auth";
import { redisMissingInProduction } from "@/lib/server/redis";

export const metadata: Metadata = { title: "Entrar • Painel Batatas da Val" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const secretOk = authConfigured();
  // Sem lugar para guardar os dados, avisamos em vez de deixar o envio falhar.
  const storageOk = !redisMissingInProduction;
  const canLogin = secretOk && storageOk ? await loginAvailable().catch(() => false) : false;

  return <LoginForm secretOk={secretOk} storageOk={storageOk} canLogin={canLogin} />;
}
