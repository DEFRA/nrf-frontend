import { statusCodes } from '../constants/status-codes.js'
import { createLogger } from '../helpers/logging/logger.js'
import { postRequestToBackend } from './nrf-backend.js'

const logger = createLogger()

/**
 * Fetch nearby waste water treatment works from the impact assessor.
 * @param {object} boundaryGeometry - RLB geometry as GeoJSON (EPSG:27700)
 * @returns {Promise<Array<{id: string, name: string, distance: number}>>}
 */
export async function getWasteWaterTreatmentWorks(boundaryGeometry) {
  if (!boundaryGeometry) {
    logger.warn('No boundary geometry provided for nearby WWTW lookup')
    return []
  }

  try {
    const { res, payload } = await postRequestToBackend({
      endpointPath: '/wwtw/nearby',
      payload: { geometry: boundaryGeometry }
    })

    if (res.statusCode >= statusCodes.badRequest) {
      const error =
        payload?.error ?? `Nearby WWTW request failed (${res.statusCode})`
      logger.error(
        `Nearby WWTW error - statusCode: ${res.statusCode}, error: ${error}`
      )
      return []
    }

    return (payload.nearbyWwtws || []).map((wwtw) => ({
      id: String(wwtw.wwtwId),
      name: wwtw.wwtwName,
      distance: wwtw.distanceKm
    }))
  } catch (error) {
    logger.error(`Error fetching nearby WWTWs: ${error?.message}`)
    return []
  }
}
