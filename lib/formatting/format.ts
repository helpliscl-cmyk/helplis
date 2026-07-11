export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sin dato";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return "Sin dato";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(new Date(value));
}

export function formatPercent(value: number | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("es-CL", {
    maximumFractionDigits: 1,
  })}%`;
}

export function maskPhone(phone: string | null | undefined) {
  if (!phone) return "No visible";
  const visible = phone.slice(-4);
  return `•••• ${visible}`;
}

export function parseBooleanFormValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}
