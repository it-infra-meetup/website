import { resolve } from 'node:path'
import { API_BASE_URL, FIXTURES_DIR, SCHEMA_URL, fetchText, writeFileEnsuringDir } from './lib.ts'

const PUBLIC_ENDPOINTS: { name: string; path: string }[] = [
  { name: 'community.json',    path: '/api/v1/community/?format=json' },
  { name: 'event.json',        path: '/api/v1/event/?format=json' },
  { name: 'event_detail.json', path: '/api/v1/event_detail/?format=json' },
]

async function main(): Promise<void> {
  for (const ep of PUBLIC_ENDPOINTS) {
    const url = `${API_BASE_URL}${ep.path}`
    process.stdout.write(`GET ${url} ... `)
    const text = await fetchText(url)
    const pretty = JSON.stringify(JSON.parse(text), null, 2) + '\n'
    await writeFileEnsuringDir(resolve(FIXTURES_DIR, ep.name), pretty)
    process.stdout.write(`wrote ${ep.name}\n`)
  }

  process.stdout.write(`GET ${SCHEMA_URL} ... `)
  const schemaYaml = await fetchText(SCHEMA_URL)
  await writeFileEnsuringDir(resolve(FIXTURES_DIR, 'openapi.yaml'), schemaYaml)
  process.stdout.write('wrote openapi.yaml\n')
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
