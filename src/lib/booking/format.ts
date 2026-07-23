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
