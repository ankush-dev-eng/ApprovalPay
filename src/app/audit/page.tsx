import { listProposals } from "@/lib/store";
export const dynamic = "force-dynamic";
export default async function Audit() {
  const list = await listProposals();
  return (
    <pre className="p-6 text-sm">{JSON.stringify(list.map(({ id, status, verdict, orderId, note }) => ({ id, status, total: verdict.totalCents, orderId, note })), null, 2)}</pre>
  );
}
