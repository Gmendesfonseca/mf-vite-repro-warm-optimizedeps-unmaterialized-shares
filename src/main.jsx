import { createRoot } from 'react-dom/client'
import ExportApp from './export-app'

// The JSX below compiles to an import of `react/jsx-dev-runtime`, which the
// plugin rewrites into a generated `__loadShare__` wrapper module. On a warm
// optimizeDeps cache that wrapper's exported binding is still `undefined` when
// this module body runs, so the render throws.
//
// Logged so a run that gets this far can be told apart from one that does not:
// on the warm run this line never prints.
console.log('typeof createRoot =', typeof createRoot)

createRoot(document.getElementById('root')).render(<ExportApp />)
