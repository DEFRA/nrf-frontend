import { getAllByRole, getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../../test-utils/setup-test-server.js'
import { setupSeededRequestToUseServer } from '../../../../test-utils/setup-seeded-request-to-use-server.js'
import { getResponse } from '../../../../test-utils/get-response.js'
import { loadPage } from '../../../../test-utils/load-page.js'
import { submitForm } from '../../../../test-utils/submit-form.js'
import { withCompleteQuoteSession } from '../../../../test-utils/with-complete-quote-session.js'
import {
  boundaryGeojson,
  boundaryGeojsonWithExcludedArea
} from '../../../../test-utils/fixtures/boundary-geojson.js'

describe('Change file preview page', () => {
  const getServer = setupTestServer()
  const getSeededServer = setupSeededRequestToUseServer()
  const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'

  it('should redirect to the start page when there is no request to use session', async () => {
    const response = await getResponse({
      server: getServer(),
      requestUrl: routePath,
      cookie: await withCompleteQuoteSession(getServer())
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/manage/start-page')
  })

  it('should show the boundary preview with retry links inside the change alias', async () => {
    const cookie = await withCompleteQuoteSession(getSeededServer())

    const document = await loadPage({
      requestUrl: routePath,
      server: getSeededServer(),
      cookie
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your uploaded red line boundary file'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/request-to-use/change/upload-boundary'
    )
    for (const link of getAllByRole(document, 'link', {
      name: 'Upload a new file or draw on a map'
    })) {
      expect(link).toHaveAttribute(
        'href',
        '/request-to-use/change/boundary-type'
      )
    }
    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()
  })

  it('should return to the review page when the boundary is saved', async () => {
    const { response } = await submitForm({
      requestUrl: routePath,
      server: getSeededServer(),
      formData: {},
      cookie: await withCompleteQuoteSession(getSeededServer())
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe(reviewQuoteDetailsPath)
  })

  it('should drop out to the change excluded area page when the saved boundary is in an exclusion zone', async () => {
    const seededServer = getSeededServer()
    const cookie = await withCompleteQuoteSession(seededServer)
    // Replace the complete session's EDP boundary with an excluded one, as an
    // upload whose boundary check found an exclusion zone would have cached.
    await submitForm({
      requestUrl: '/request-to-use/change/draw-boundary/save',
      server: seededServer,
      formData: { boundaryGeojson: boundaryGeojsonWithExcludedArea },
      cookie
    })

    const response = await getResponse({
      server: seededServer,
      requestUrl: routePath,
      cookie
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(
      '/request-to-use/change/excluded-area'
    )
  })

  it('should drop out to the change not in EDP page when the uploaded boundary misses every EDP', async () => {
    const seededServer = getSeededServer()
    const cookie = await withCompleteQuoteSession(seededServer)
    // Replace the complete session's EDP boundary with one outside every EDP,
    // as an upload whose boundary check found no EDP would have cached.
    await submitForm({
      requestUrl: '/request-to-use/change/draw-boundary/save',
      server: seededServer,
      formData: { boundaryGeojson },
      cookie
    })

    const response = await getResponse({
      server: seededServer,
      requestUrl: routePath,
      cookie
    })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe('/request-to-use/change/not-in-edp')
  })

  it('should drop out to the change not in EDP page when the saved boundary misses every EDP', async () => {
    const seededServer = getSeededServer()
    const cookie = await withCompleteQuoteSession(seededServer)
    // Replace the complete session's EDP boundary with one outside every EDP.
    await submitForm({
      requestUrl: '/request-to-use/change/draw-boundary/save',
      server: seededServer,
      formData: { boundaryGeojson },
      cookie
    })

    const { response } = await submitForm({
      requestUrl: routePath,
      server: seededServer,
      formData: {},
      cookie
    })

    expect(response.statusCode).toBe(303)
    expect(response.headers.location).toBe('/request-to-use/change/not-in-edp')
  })
})
