import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'remote-a',
      filename: 'remoteEntry.js',
      // Unrelated to the bug; the dts worker needs a tsconfig and this repro has none.
      dts: false,
      // A remote-only container: it exposes a module and declares no `remotes`.
      exposes: { './export-app': './src/export-app.jsx' },
      shared: {
        react: { singleton: true, requiredVersion: '^19.2.0' },
      },
    }),
  ],
  server: { port: 5301, strictPort: true },
})
