import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { config } from '../../config/config.js'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { DEFRA_ID_ACCOUNT_PATH } from '../auth/auth-urls.js'
import { profileController } from './controller.js'

const backendUrl = config.get('backend').apiUrl
const defraAccountUrl = new URL(
  DEFRA_ID_ACCOUNT_PATH,
  config.get('defraId.baseUrl')
).toString()

const server = setupMswServer()

describe('profileController', () => {
  const buildH = () => ({
    view: (template, model) => ({ template, model }),
    redirect: (path) => ({ redirectTo: path })
  })

  const sessionProfile = {
    id: 'user-123',
    firstName: 'Session',
    lastName: 'Profile',
    email: 'session@example.com'
  }

  const buildRequest = (profile) => ({ auth: { credentials: { profile } } })

  const stubBackendUser = (body, status = 200) =>
    server.use(
      http.get(
        `${backendUrl}/users`,
        () =>
          new HttpResponse(body === null ? undefined : JSON.stringify(body), {
            status,
            headers: { 'content-type': 'application/json' }
          })
      )
    )

  it('should redirect to login when there are no credentials', async () => {
    const result = await profileController.handler({ auth: {} }, buildH())

    expect(result.redirectTo).toBe('/login')
  })

  it('should render the user details and organisations from nrf-backend', async () => {
    stubBackendUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      organisations: [
        { defraId: 'org-1', name: 'Acme Ltd', relationshipType: 'Employee' },
        { defraId: 'org-2', name: 'Beta Ltd', relationshipType: null }
      ]
    })

    const result = await profileController.handler(
      buildRequest(sessionProfile),
      buildH()
    )

    expect(result.template).toBe('profile/index')
    expect(result.model.user).toEqual({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com'
    })
    expect(result.model.organisations).toEqual([
      { defraId: 'org-1', name: 'Acme Ltd', relationshipType: 'Employee' },
      { defraId: 'org-2', name: 'Beta Ltd', relationshipType: null }
    ])
    expect(result.model.defraAccountUrl).toBe(defraAccountUrl)
  })

  it.each([404, 500])(
    'should fall back to the session profile when nrf-backend responds with %i',
    async (status) => {
      stubBackendUser(null, status)

      const result = await profileController.handler(
        buildRequest(sessionProfile),
        buildH()
      )

      expect(result.template).toBe('profile/index')
      expect(result.model.user).toEqual({
        firstName: 'Session',
        lastName: 'Profile',
        email: 'session@example.com'
      })
      expect(result.model.organisations).toEqual([])
    }
  )
})
