import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs"
import { dirname, resolve, sep } from "node:path"

const projectRoot = process.cwd()
const standaloneRoot = resolve(projectRoot, ".next/standalone")
// Next may trace dotenv files used at build time. Never ship local credentials/data.
for (const name of readdirSync(standaloneRoot)) {
  if (!name.startsWith('.env') && !['data', '.git', '.agents', 'tests'].includes(name)) continue
  const target = resolve(standaloneRoot, name)
  if (!target.startsWith(standaloneRoot + sep)) throw new Error('Unsafe generated-artifact cleanup')
  rmSync(target, { recursive: true, force: true })
}
const assets = [
  [resolve(projectRoot, "public"), resolve(standaloneRoot, "public")],
  [resolve(projectRoot, ".next/static"), resolve(standaloneRoot, ".next/static")],
]

for (const [source, destination] of assets) {
  if (!existsSync(source)) continue
  mkdirSync(dirname(destination), { recursive: true })
  cpSync(source, destination, { recursive: true, force: true })
}

console.log("Copied public and .next/static into .next/standalone.")
