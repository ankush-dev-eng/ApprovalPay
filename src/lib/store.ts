import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Proposal } from "./types";

const dir = process.env.AUDIT_DIR ?? path.join(process.cwd(), "data");
const file = path.join(dir, "audit.json");
const MAX_RECORDS = 300;

let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function read(): Promise<Proposal[]> {
  try { return JSON.parse(await fs.readFile(file, "utf8")) as Proposal[]; } catch { return []; }
}
async function write(list: Proposal[]) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(list.slice(-MAX_RECORDS), null, 2));
}

export const listProposals = async () =>
  (await read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const getProposal = async (id: string) => (await read()).find((p) => p.id === id) ?? null;
export const findByOrderId = async (orderId: string) =>
  (await read()).find((p) => p.orderId === orderId) ?? null;
export const saveProposal = (p: Proposal) =>
  serial(async () => { const l = await read(); l.push(p); await write(l); return p; });
export const updateProposal = (id: string, patch: Partial<Proposal>) =>
  serial(async () => {
    const l = await read();
    const i = l.findIndex((p) => p.id === id);
    if (i < 0) return null;
    l[i] = { ...l[i], ...patch };
    await write(l);
    return l[i];
  });

