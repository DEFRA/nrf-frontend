import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
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
  })
})
