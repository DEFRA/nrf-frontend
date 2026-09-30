import { describe, it, expect } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { VectorTile } from '@mapbox/vector-tile'
import { PbfReader } from 'pbf'
import { statusCodes } from '../../common/constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { createVectorTile } from '../../../test-utils/create-vector-tile.js'
import { seaLayerName } from './encode-sea-tile.js'

const extent = 4096
const osTileUrl = 'https://api.os.uk/maps/vector/v1/vts/tile/:z/:y/:x.pbf'
const seaMaskUrl = '/os-base-map/sea-mask/11/1033/670.pbf'
const midAtlanticSeaMaskUrl = '/os-base-map/sea-mask/11/853/647.pbf'
const slowUpstreamMs = 300

const westernHalfIsLand = [
  [
    [0, 0],
    [extent / 2, 0],
    [extent / 2, extent],
    [0, extent],
    [0, 0]
  ]
]

const getServer = setupTestServer()
const mswServer = setupMswServer()

function respondWithLandTile() {
  return http.get(osTileUrl, () =>
    HttpResponse.arrayBuffer(
      createVectorTile({ layers: { GB_land: [westernHalfIsLand] }, extent })
    )
  )
}

describe('sea mask tile route', () => {
  it('serves the water side of the requested tile as a vector tile', async () => {
    mswServer.use(respondWithLandTile())

    const response = await getServer().inject({
      method: 'GET',
      url: seaMaskUrl
    })

    expect(response.statusCode).toBe(statusCodes.ok)

    const layer = new VectorTile(new PbfReader(response.rawPayload)).layers[
      seaLayerName
    ]
    const xs = layer
      .feature(0)
      .loadGeometry()[0]
      .map((point) => point.x)
    expect(Math.min(...xs)).toBe(extent / 2)
  })

  it('serves an empty tile rather than an error when Ordnance Survey fails', async () => {
    mswServer.use(
      http.get(osTileUrl, () =>
        HttpResponse.text('upstream down', {
          status: statusCodes.serviceUnavailable
        })
      )
    )

    const response = await getServer().inject({
      method: 'GET',
      url: seaMaskUrl
    })

    expect(response.statusCode).toBe(statusCodes.noContent)
    expect(response.rawPayload).toHaveLength(0)
    expect(response.headers['cache-control']).toContain('no-store')
  })

  it('serves an empty tile when Ordnance Survey is too slow to respond', async () => {
    mswServer.use(
      http.get(osTileUrl, async () => {
        await delay(slowUpstreamMs)
        return HttpResponse.arrayBuffer(
          createVectorTile({ layers: { GB_land: [westernHalfIsLand] }, extent })
        )
      })
    )

    const response = await getServer().inject({
      method: 'GET',
      url: seaMaskUrl
    })

    expect(response.statusCode).toBe(statusCodes.noContent)
  })

  it('masks a tile far from England as all sea without asking Ordnance Survey', async () => {
    // No handler is registered, so any Ordnance Survey request would fail and
    // the route would fall back to an empty tile.
    const response = await getServer().inject({
      method: 'GET',
      url: midAtlanticSeaMaskUrl
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    const layer = new VectorTile(new PbfReader(response.rawPayload)).layers[
      seaLayerName
    ]
    expect(layer.length).toBe(1)
    expect(response.headers['cache-control']).toContain('public')
  })
})
