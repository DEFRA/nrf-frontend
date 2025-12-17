import { describe, it, expect } from 'vitest'
import { profileController } from './controller.js'

describe('Profile Controller', () => {
  describe('profileController', () => {
    it('should redirect to login when no credentials', () => {
      const request = {
        auth: {}
      }
      const h = {
        redirect: (path) => ({ redirectTo: path })
      }

      const result = profileController.handler(request, h)

      expect(result.redirectTo).toBe('/login')
    })

    it('should render profile page with authenticated user', () => {
      const request = {
        auth: {
          credentials: {
            profile: {
              email: 'test@example.com',
              name: 'Test User',
              crn: '12345',
              organisationId: 'org-123',
              currentRelationshipId: 'rel-456'
            }
          }
        }
      }
      const h = {
        view: (template, context) => ({ template, context })
      }

      const result = profileController.handler(request, h)

      expect(result.template).toBe('profile/index')
      expect(result.context.pageTitle).toBe('My Profile')
      expect(result.context.user.email).toBe('test@example.com')
      expect(result.context.user.name).toBe('Test User')
      expect(result.context.user.crn).toBe('12345')
      expect(result.context.user.organisationId).toBe('org-123')
      expect(result.context.authEnabled).toBe(true)
    })
  })
})
