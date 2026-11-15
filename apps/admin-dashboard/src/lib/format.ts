const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactMoneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export function formatMoney(cents: number): string {
  return moneyFormatter.format(cents / 100);
}

export function formatMoneyCompact(cents: number): string {
  return compactMoneyFormatter.format(cents / 100);
}

export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`)).replace(".", "");
}

export function formatShortDate(date: string): string {
  return shortDateFormatter.format(new Date(`${date}T12:00:00Z`)).replace(".", "");
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso)).replace(".", "");
}

export function formatPercent(value: number, digits = 0): string {
  return new Intl.NumberFormat("es-MX", {
    style: "percent",
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatHash(hash: string, size = 10): string {
  return `${hash.slice(0, size)}…${hash.slice(-4)}`;
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const label = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${year}-${month}-15T12:00:00Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}
