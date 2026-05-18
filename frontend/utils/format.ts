export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function compactDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

