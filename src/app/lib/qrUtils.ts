export function extractJobCodeFromQrValue(rawValue: string) {
  let value = (rawValue || "").trim();
  if (!value) return "";

  const readJobFromSearch = (search: string) => {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    return (params.get("job") || "").trim();
  };

  try {
    const absoluteUrl = new URL(value);
    const fromAbsolute = readJobFromSearch(absoluteUrl.search);
    if (fromAbsolute) return fromAbsolute;
  } catch {
    // not absolute URL
  }

  if (value.startsWith("/")) {
    try {
      const relativeUrl = new URL(value, window.location.origin);
      const fromRelative = readJobFromSearch(relativeUrl.search);
      if (fromRelative) return fromRelative;
    } catch {
      // ignore
    }
  }

  if (value.includes("job=")) {
    const queryPart = value.includes("?") ? value.split("?").slice(1).join("?") : value;
    const fromQuery = readJobFromSearch(queryPart);
    if (fromQuery) return fromQuery;
  }

  return value;
}
