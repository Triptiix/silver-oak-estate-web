export function formatInrFromPaise(amountPaise: number): string {
  if (!Number.isSafeInteger(amountPaise)) {
    throw new Error("Amount must be a safe integer");
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

export function calculateRemainingBalancePaise(priceAmountPaise: number, advanceAmountPaise: number): number {
  if (!Number.isSafeInteger(priceAmountPaise) || !Number.isSafeInteger(advanceAmountPaise)) {
    throw new Error("Amounts must be safe integers");
  }
  if (priceAmountPaise < 0 || advanceAmountPaise < 0) {
    throw new Error("Amounts cannot be negative");
  }
  if (advanceAmountPaise > priceAmountPaise) {
    throw new Error("Advance amount cannot exceed total price");
  }
  return priceAmountPaise - advanceAmountPaise;
}
