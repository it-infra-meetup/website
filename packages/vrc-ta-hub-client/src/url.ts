export type QueryValue = string | number | boolean | undefined | null

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

export function buildUrl(
  normalizedBaseUrl: string,
  path: string,
  params: Record<string, QueryValue>,
): string {
  const search = new URLSearchParams()
  search.set('format', 'json')
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.append(key, String(value))
  }
  return `${normalizedBaseUrl}${path}?${search.toString()}`
}
