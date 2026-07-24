export function wireMapErrorLogging(mapInstance) {
  // MapLibre 'error' events include tile fetch failures which are non-fatal
  // (network blips, missing tiles) — suppress to avoid log noise
  mapInstance.on('error', function () {})
}
