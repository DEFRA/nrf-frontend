import { http, HttpResponse } from 'msw'
import { config } from '../config/config.js'
import { recalculatedLevy } from './fixtures/levy.js'

/**
 * Stubs the impact assessor's levy recalculation endpoint.
 * @param {import('msw/node').SetupServerApi} mswServer
 * @param {object} [options]
 * @param {object} [options.levy] - response body on success
 * @param {number} [options.status] - respond with this status instead of the levy when not 200
 * @returns {{ body: object, headers: Record<string, string> }[]} the requests received
 */
export const mockRecalculateLevy = (
  mswServer,
  { levy = recalculatedLevy, status = 200 } = {}
) => {
  const requests = []
  mswServer.use(
    http.post(
      `${config.get('impactAssessor.baseUrl')}/levy/recalculate`,
      async ({ request }) => {
        requests.push({
          body: await request.json(),
          headers: Object.fromEntries(request.headers)
        })
        return status === 200
          ? HttpResponse.json(levy)
          : HttpResponse.json({ detail: 'error' }, { status })
      }
    )
  )
  return requests
}
