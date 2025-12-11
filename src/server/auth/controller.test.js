import { describe, it, expect } from 'vitest'
import { loginController } from './controller.js'

describe('Auth Controller', () => {
  describe('loginController', () => {
    it('should render login page when not authenticated', () => {
      const request = {
        auth: { isAuthenticated: false }
      }
      const h = {
        view: (template, context) => ({ template, context })
      }

      const result = loginController.handler(request, h)

      expect(result.template).toBe('auth/login')
      expect(result.context.pageTitle).toBe('Sign in')
      expect(result.context.loginUrl).toBe('/login/out')
    })

    it('should redirect to home when already authenticated', () => {
      const request = {
        auth: { isAuthenticated: true }
      }
      const h = {
        redirect: (path) => ({ redirectTo: path })
      }

      const result = loginController.handler(request, h)

      expect(result.redirectTo).toBe('/')
    })
  })
})
