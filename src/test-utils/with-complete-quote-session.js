import { submitForm } from './submit-form.js'
import { withValidQuoteSession } from './with-valid-quote-session.js'
import { boundaryGeojsonWithEdp } from './fixtures/boundary-geojson.js'
import { routePath as planningTypePath } from '../server/quote/planning-type/routes.js'
import { routePath as confirmHousingPath } from '../server/quote/confirm-housing/routes.js'
import { routePath as unitNumberPath } from '../server/quote/unit-number/routes.js'
import { routePath as boundaryTypePath } from '../server/quote/boundary-type/routes.js'
import { savePath as drawBoundarySavePath } from '../server/quote/draw-boundary/routes.js'
import { routePath as emailPath } from '../server/quote/email/routes.js'

/**
 * Prime a quote session in which every required question has been answered,
 * by driving the real routes end to end (planning type → housing → units →
 * drawn boundary → email). The session then satisfies the complete quote
 * schema, so pages gated on quote completeness (check-your-answers) render.
 * Returns the combined session cookie.
 * @param {object} server
 * @returns {Promise<string>}
 */
export async function withCompleteQuoteSession(server) {
  let { cookie } = await submitForm({
    requestUrl: planningTypePath,
    server,
    formData: { planningType: 'full-planning-permission' },
    cookie: await withValidQuoteSession(server)
  })
  ;({ cookie } = await submitForm({
    requestUrl: confirmHousingPath,
    server,
    formData: { isHousing: 'yes' },
    cookie
  }))
  ;({ cookie } = await submitForm({
    requestUrl: unitNumberPath,
    server,
    formData: { housingUnits: '42' },
    cookie
  }))
  ;({ cookie } = await submitForm({
    requestUrl: boundaryTypePath,
    server,
    formData: { boundaryEntryType: 'draw' },
    cookie
  }))
  ;({ cookie } = await submitForm({
    requestUrl: drawBoundarySavePath,
    server,
    formData: { boundaryGeojson: boundaryGeojsonWithEdp },
    cookie
  }))
  ;({ cookie } = await submitForm({
    requestUrl: emailPath,
    server,
    formData: { email: 'test@example.com' },
    cookie
  }))
  return cookie
}
