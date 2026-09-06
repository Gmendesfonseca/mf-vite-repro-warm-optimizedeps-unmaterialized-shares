# mf-vite-repro-warm-optimizedeps-unmaterialized-shares

Minimal reproduction for [module-federation/vite#1219](https://github.com/module-federation/vite/issues/1219).

On a dev server for a remote-only container, whether shared modules work depends on whether
`node_modules/.vite` is cold or warm.

| run | result |
| --- | --- |
| cold (`node_modules/.vite` removed) | renders `mounted` |
| warm (second `vite` start) | throws before mounting, page stays blank |

Deterministic: 3/3 warm runs fail, and clearing `node_modules/.vite` makes it pass again every time.

## Run it

```sh
npm install

npm run cold   # clears node_modules/.vite, then starts vite -> renders "mounted"
# stop the server (ctrl-c), then:
npm run warm   # starts vite again, cache now warm -> blank page, console throws
```

Open http://localhost:5301 for each run.

## Expected vs actual

**Expected:** the page renders `mounted` both times.

**Actual:** the warm run throws before mounting:

```
Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'S')
    at node_modules/.vite/deps/react-dom_client.js
```

The `typeof createRoot = function` line that `src/main.jsx` logs never prints on the warm run —
the failure happens while evaluating the entry's imports, before its body runs.

Which binding is the casualty depends on evaluation order; adding `react-dom` and
`react-dom/client` to `shared` makes the same run throw `_jsxDEV is not a function` instead.

## What differs between the two runs

Every generated module is byte-identical. The only difference is the `materialize` flags in the
served `virtual:mf-localSharedImportMap`:

| share | cold | warm |
| --- | --- | --- |
| `react` | `materialize: true` | `materialize: false` |
| `react/jsx-dev-runtime` | `materialize: true` | `materialize: false` |
| `react/jsx-runtime` | `materialize: false` | `materialize: false` |
| `react/compiler-runtime` | `materialize: false` | `materialize: false` |

`__mfSeedKeys` filters on `materialize !== false`, so on the warm run `init()` seeds nothing and
every `__loadShare__` wrapper falls through to the deferred browser branch, which assigns its
exported bindings only after the wrapper module's own evaluation has already finished.

`react/jsx-dev-runtime` is injected by the JSX transform and never written in source, so the
plugin's textual entry-graph crawl cannot see it. The other observer that would mark it used is
the resolver hook installed into `optimizeDeps`, and Vite runs that only while it scans
dependencies — which it skips entirely once `node_modules/.vite` is warm.

## Controls

Two variations that pin the cause rather than the symptom:

- Replace all JSX with `createElement` calls, so nothing imports the automatic runtime: the warm
  run **passes**.
- Declare `'react/jsx-dev-runtime'` explicitly in `shared`: this does **not** help.

## Workaround

A textual import of the runtime in an entry file makes the crawl see it, and the warm run passes:

```js
import 'react/jsx-dev-runtime'
```

## Affected versions

Bisected on this reproduction, warm run:

| `@module-federation/vite` | warm run |
| --- | --- |
| 1.20.6 | passes |
| 1.20.7 | fails |
| 1.21.0 | fails |
| 1.21.2 | fails |
| 1.21.3 | fails |
| `main` @ `fe9770b` | fails |

Environment: vite 8.2.2, react / react-dom 19.2.0, node 24, Linux.
