import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const PKG_ROOT = resolve(fileURLToPath(import.meta.url), '../..')
export const FIXTURES_DIR = resolve(PKG_ROOT, 'tests/__fixtures__')

export const API_BASE_URL = 'https://vrc-ta-hub.com'
export const SCHEMA_URL = `${API_BASE_URL}/api/schema/`

export async function writeFileEnsuringDir(filePath: string, contents: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, contents, 'utf-8')
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: 'application/json, application/yaml, */*' } })
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status} ${response.statusText}`)
  }
  return await response.text()
}
