import { setWorkerUrl } from 'maplibre-gl'

const MAPLIBRE_WORKER_URL = '/public/maplibre/maplibre-gl-worker.mjs'

/**
 * maplibre-gl v6 is ESM-only and can no longer derive its web-worker URL
 * when bundled — v5 wired the worker up itself. Under webpack the derived
 * URL is empty, so no worker ever starts: vector tiles and GeoJSON are
 * never parsed, which leaves the boundary and drawn-line layers silently
 * unrendered. Point maplibre at the worker file copied into the build by
 * webpack.config.js ("setWorkerUrl() is bundler-only", v5→v6 migration
 * guide). Idempotent — just sets a module-level value.
 */
export function configureMaplibreWorker() {
  setWorkerUrl(MAPLIBRE_WORKER_URL)
}
