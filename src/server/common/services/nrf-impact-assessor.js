import Boom from '@hapi/boom'
import Wreck from '@hapi/wreck'
import { buildServiceHeaders } from '@defra/nrf-library'
import { config } from '../../../config/config.js'
import { createLogger } from '../helpers/logging/logger.js'

const logger = createLogger()

const impactAssessorHeaders = (extraHeaders) =>
  buildServiceHeaders({
    traceHeaderName: config.get('tracing.header'),
    serviceKey: config.get('impactAssessor.apiKey'),
    extraHeaders
  })

function getImpactAssessorUrl(path, query) {
  const baseUrl = config.get('impactAssessor.baseUrl')
  const params = new URLSearchParams(query)
  const base = path ? `${baseUrl}/${path}` : baseUrl
  const queryString = params.toString()
  return queryString ? `${base}?${queryString}` : base
}

export const getMapTile = async (path, request) => {
  const upstreamUrl = getImpactAssessorUrl(path, request.query)
  logger.debug(`Impact assessor proxy request: ${path || '/'}`)
  return fetch(upstreamUrl, {
    redirect: 'follow',
    headers: impactAssessorHeaders()
  })
}

/**
 * Recalculates the levy for an EDP, number of housing units and date.
 * @param {{ edpId?: number, units: number, requestDate: string }} params - requestDate is YYYY-MM-DD
 * @returns {Promise<{ calculationDate: string, provisionalAmount: number, inflationAdjustedAmount: number }>} calculationDate is an ISO date-time
 * @throws {import('@hapi/boom').Boom} a 500 when the request fails or the impact assessor responds with a non-2xx status
 */
export const recalculateLevy = async ({ edpId, units, requestDate }) => {
  try {
    const { payload } = await Wreck.post(
      getImpactAssessorUrl('levy/recalculate'),
      {
        payload: { edpId, units, requestDate },
        json: true,
        headers: impactAssessorHeaders()
      }
    )
    return payload
  } catch (error) {
    logger.error(error, 'Levy recalculation request to impact assessor failed')
    // Whatever the upstream status (a 502 from Wreck, a 404 or 422 from the
    // impact assessor), the user sees the 500 error page.
    throw Boom.internal('Levy recalculation failed', error)
  }
}
