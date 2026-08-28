import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'

import { config } from '../../config/config.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { setupMswServer } from '../../test-utils/setup-msw-server.js'
import { syncUserToBackend } from './sync-user-to-backend.js'

const backendUrl = config.get('backend').apiUrl
const DEFRA_ID = 'user-123'

const mswServer = setupMswServer()

describe('syncUserToBackend', () => {
  const createSessionCache = () => ({
    set: vi.fn().mockResolvedValue(undefined)
  })

  const createSession = (profile, userSaved = false) => ({
    sessionId: 'session-1',
    profile,
    userSaved
  })

  const citizenProfile = {
    id: DEFRA_ID,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  }

  it('PATCHes the user to nrf-backend and marks the session as saved', async () => {
    const bodies = []
    mswServer.use(
      http.patch(`${backendUrl}/users`, async ({ request }) => {
        bodies.push(await request.json())
        return new HttpResponse(null, { status: 204 })
      })
    )

    const sessionCache = createSessionCache()

    await syncUserToBackend({
      userSession: createSession(citizenProfile),
      sessionCache
    })

    expect(bodies).toEqual([
      {
        defraId: DEFRA_ID,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    ])
    expect(sessionCache.set).toHaveBeenCalledWith('session-1', {
      sessionId: 'session-1',
      profile: citizenProfile,
      userSaved: true
    })
  })

  it.each(['Employee', 'Agent'])(
    'includes the organisation details for a %s sign-in',
    async (relationshipType) => {
      const bodies = []
      mswServer.use(
        http.patch(`${backendUrl}/users`, async ({ request }) => {
          bodies.push(await request.json())
          return new HttpResponse(null, { status: 204 })
        })
      )

      await syncUserToBackend({
        userSession: createSession({
          ...citizenProfile,
          organisation: {
            organisationId: 'org-123',
            organisationName: 'CDP Child Org 1',
            userRelationshipType: relationshipType
          }
        }),
        sessionCache: createSessionCache()
      })

      expect(bodies).toEqual([
        {
          defraId: DEFRA_ID,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          organisationDefraId: 'org-123',
          organisationName: 'CDP Child Org 1',
          relationshipType
        }
      ])
    }
  )

  it.each([
    ['no defra id', { email: 'test@example.com' }],
    ['no email', { id: DEFRA_ID, firstName: 'Test', lastName: 'User' }]
  ])(
    'skips the backend call and marks the session as saved when there is %s',
    async (_name, profile) => {
      const sessionCache = createSessionCache()

      await syncUserToBackend({
        userSession: createSession(profile),
        sessionCache
      })

      expect(sessionCache.set).toHaveBeenCalledWith('session-1', {
        sessionId: 'session-1',
        profile,
        userSaved: true
      })
    }
  )

  it.each([
    ['the user has no matching record yet', statusCodes.notFound],
    ['the backend has an unexpected error', statusCodes.internalServerError]
  ])(
    'leaves the session unsaved so it retries next request when %s (%i)',
    async (_name, statusCode) => {
      mswServer.use(
        http.patch(
          `${backendUrl}/users`,
          () => new HttpResponse(null, { status: statusCode })
        )
      )

      const sessionCache = createSessionCache()
      const userSession = createSession(citizenProfile)

      await expect(
        syncUserToBackend({ userSession, sessionCache })
      ).rejects.toThrow()

      expect(userSession.userSaved).toBe(false)
      expect(sessionCache.set).not.toHaveBeenCalled()
    }
  )
})
