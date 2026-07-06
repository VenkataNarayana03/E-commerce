const INR_EXCHANGE_RATE = 83;

export function formatCurrency(value, currency = "USD") {
  const numericValue = Number(value) || 0;

  if (currency === "INR") {
    return `₹${numericValue.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${numericValue.toFixed(2)}`;
}

export function formatDualPrice(value) {
  const numericValue = Number(value) || 0;
  const inrValue = numericValue * INR_EXCHANGE_RATE;

  return `${formatCurrency(numericValue, "USD")} / ${formatCurrency(inrValue, "INR")}`;
}
