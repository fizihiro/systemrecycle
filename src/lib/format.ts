export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(Number(value));
}

export function formatNumber(value: number | string, digits = 2) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value));
}

export function toInputDate(value?: Date | string | null) {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function parseDecimal(value: unknown) {
  return Number(value);
}
