import { describe, expect, it, vi } from 'vitest'
import { requestToUseController } from './controller-get.js'
import { createSessionRequest } from '../../test-utils/create-session-request.js'
import { getOrganisationFromToken } from '../auth/get-organisation-from-auth-token.js'
import {
  currentRelationshipId,
  firstOrgName,
  multiOrgEmployeeClaims
} from '../../test-utils/fixtures/defra-id-org-claims.js'

const quote = { planningType: 'residential' }
const retrieveQuote = { email: 'test@example.com' }
const requestToUse = { variation: 'yes' }
const flash = {
  validationErrors: { summary: [{ text: 'Select an answer' }] },
  formSubmitData: { variation: 'no' }
}

const profile = {
  name: 'Test User',
  currentRelationshipId,
  organisation: getOrganisationFromToken(multiOrgEmployeeClaims)
}

const query = { nrlReference: 'NRL-123456' }

const handle = async ({ session = {}, credentials, getViewModel }) => {
  const request = createSessionRequest({
    session,
    query,
    path: '/request-to-use/variation',
    url: new URL('http://localhost/request-to-use/variation'),
    auth: { credentials }
  })
  const h = { view: vi.fn().mockReturnValue('rendered') }
  const { handler } = requestToUseController({
    routeId: 'variation',
    getViewModel
  })

  const response = await handler(request, h)

  return { request, h, response }
}

describe('requestToUseController', () => {
  it('hands the view model every session namespace, the signed-in user, the flashed values and the query', async () => {
    const getViewModel = vi.fn().mockResolvedValue({})

    await handle({
      session: { quote, retrieveQuote, requestToUse, quoteFlash: flash },
      credentials: { profile },
      getViewModel
    })

    expect(getViewModel).toHaveBeenCalledWith({
      session: { quote, retrieveQuote, requestToUse },
      signedInUser: expect.objectContaining({
        displayName: 'Test User',
        currentRelationshipId
      }),
      formSubmitData: flash.formSubmitData,
      query
    })
  })

  it('renders the route view in the request to use views', async () => {
    const { h, response } = await handle({
      getViewModel: vi.fn().mockResolvedValue({ pageHeading: 'A heading' })
    })

    expect(response).toBe('rendered')
    expect(h.view).toHaveBeenCalledWith(
      'request-to-use/variation/index',
      expect.objectContaining({ pageHeading: 'A heading' })
    )
  })

  it('shows the saved answers with the flashed values on top, then clears the flash', async () => {
    const { h, request } = await handle({
      session: { quoteFlash: flash },
      getViewModel: vi.fn().mockResolvedValue({
        formData: { variation: 'yes', email: 'saved@example.com' }
      })
    })

    expect(h.view.mock.calls[0][1]).toMatchObject({
      formSubmitData: { variation: 'no', email: 'saved@example.com' },
      validationErrors: flash.validationErrors
    })
    expect(request.yar.get('quoteFlash')).toBeNull()
  })

  it('keeps formData out of the template context', async () => {
    const { h } = await handle({
      getViewModel: vi
        .fn()
        .mockResolvedValue({ formData: { variation: 'yes' } })
    })

    expect(h.view.mock.calls[0][1]).not.toHaveProperty('formData')
  })

  it('gives the template the organisation heading for a signed-in user', async () => {
    const { h } = await handle({
      credentials: { profile },
      getViewModel: vi.fn().mockResolvedValue({})
    })

    expect(h.view.mock.calls[0][1]).toMatchObject({
      orgOrUserName: firstOrgName,
      changeOrganisationUrl:
        '/auth/change-organisation?redirectTo=%2Frequest-to-use%2Fvariation'
    })
  })

  it('has no signed-in user and no organisation heading for a signed-out request', async () => {
    const getViewModel = vi.fn().mockResolvedValue({})

    const { h } = await handle({ getViewModel })

    expect(getViewModel.mock.calls[0][0].signedInUser).toBeUndefined()
    expect(h.view.mock.calls[0][1].orgOrUserName).toBeUndefined()
  })

  it('lets a view model replace the organisation heading', async () => {
    const { h } = await handle({
      credentials: { profile },
      getViewModel: vi.fn().mockResolvedValue({ orgOrUserName: 'Override' })
    })

    expect(h.view.mock.calls[0][1].orgOrUserName).toBe('Override')
  })
})
