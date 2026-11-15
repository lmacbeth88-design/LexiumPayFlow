import { createHash } from "node:crypto";
import type { LedgerEntry, LedgerEntryType } from "@lexium/shared-contracts";

type UnsignedLedgerEntry = Omit<LedgerEntry, "hash">;

export function computeLedgerHash(
  prevHash: string | null,
  entry: UnsignedLedgerEntry,
): string {
  const canonical = JSON.stringify({
    sequence: entry.sequence,
    prevHash,
    type: entry.type,
    paymentRequestId: entry.paymentRequestId,
    payload: entry.payload,
    createdAt: entry.createdAt,
  });

  return createHash("sha256").update(canonical).digest("hex");
}

export class LedgerChain {
  private readonly chain: LedgerEntry[] = [];

  append(
    type: LedgerEntryType,
    paymentRequestId: string | null,
    payload: Record<string, unknown>,
    createdAt: string,
  ): LedgerEntry {
    const previous = this.chain.at(-1);
    const sequence = previous ? previous.sequence + 1 : 0;
    const prevHash = previous?.hash ?? null;
    const unsigned: UnsignedLedgerEntry = {
      sequence,
      prevHash,
      type,
      paymentRequestId,
      payload,
      createdAt,
    };
    const entry: LedgerEntry = {
      ...unsigned,
      hash: computeLedgerHash(prevHash, unsigned),
    };
    this.chain.push(entry);
    return entry;
  }

  all(): LedgerEntry[] {
    return [...this.chain];
  }

  size(): number {
    return this.chain.length;
  }

  verify(): boolean {
    let prevHash: string | null = null;

    for (const entry of this.chain) {
      if (entry.prevHash !== prevHash) {
        return false;
      }
      if (computeLedgerHash(prevHash, entry) !== entry.hash) {
        return false;
      }
      prevHash = entry.hash;
    }

    return true;
  }
}
