const IPIFY_ENDPOINT = 'https://api.ipify.org?format=json'

interface IpifyResponse {
  ip: string
}

function isIpifyResponse(value: unknown): value is IpifyResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ip' in value &&
    typeof (value).ip === 'string'
  )
}

export async function fetchPublicIp(): Promise<string> {
  const response = await fetch(IPIFY_ENDPOINT)
  if (!response.ok) {
    throw new Error(`ipify request failed with status ${response.status}`)
  }

  const json: unknown = await response.json()
  if (!isIpifyResponse(json)) {
    throw new Error('ipify response did not match the expected shape')
  }

  return json.ip
}
