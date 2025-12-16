import { describe, it, expect } from 'vitest'
import { profileController } from './controller.js'

describe('Profile Controller', () => {
  describe('profileController', () => {
    it('should render profile page with placeholder user', () => {
      const request = {}
      const h = {
        view: (template, context) => ({ template, context })
      }

      const result = profileController.handler(request, h)

      expect(result.template).toBe('profile/index')
      expect(result.context.pageTitle).toBe('My Profile')
      expect(result.context.user.email).toBe('test@example.com')
      expect(result.context.user.firstName).toBe('Test')
      expect(result.context.user.lastName).toBe('User')
    })
  })
})
