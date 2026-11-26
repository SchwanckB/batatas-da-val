import type { Metadata } from "next";
import { OrderPage } from "@/components/client/OrderPage";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function Pedido({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <OrderPage token={token} />;
}
