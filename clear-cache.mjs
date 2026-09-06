// Removes Vite's dependency-optimizer cache so the next `vite` run is a cold start.
import { rmSync } from 'node:fs'

rmSync(new URL('./node_modules/.vite', import.meta.url), { recursive: true, force: true })
console.log('cleared node_modules/.vite')
