import { describe, it, expect } from 'vitest'
import { loginController } from './controller.js'

describe('Auth Controller', () => {
  describe('loginController', () => {
    it('should render login page', () => {
      const request = {}
      const h = {
        view: (template, context) => ({ template, context })
      }

      const result = loginController.handler(request, h)

      expect(result.template).toBe('auth/login')
      expect(result.context.pageTitle).toBe('Sign in')
      expect(result.context.heading).toBe('Sign in to continue')
    })
  })
})
