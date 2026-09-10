// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

vi.mock('maplibre-gl', () => ({ setWorkerUrl: vi.fn() }))

import { setWorkerUrl } from 'maplibre-gl'
import { configureMaplibreWorker } from './configure-maplibre-worker.js'

describe('configureMaplibreWorker', () => {
  it('points maplibre at the worker file copied into the build', () => {
    configureMaplibreWorker()

    expect(setWorkerUrl).toHaveBeenCalledWith(
      '/public/maplibre/maplibre-gl-worker.mjs'
    )
  })
})
