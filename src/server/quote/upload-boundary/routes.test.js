import { describe, it, expect } from 'vitest'
import routes, { routePath } from './routes.js'

describe('upload-boundary routes', () => {
  it('should export the correct route path', () => {
    expect(routePath).toBe('/quote/upload-boundary')
  })

  it('should export an array with one route', () => {
    expect(routes).toHaveLength(1)
  })

  describe('GET route', () => {
    const getRoute = routes[0]

    it('should have method GET', () => {
      expect(getRoute.method).toBe('GET')
    })

    it('should have the correct path', () => {
      expect(getRoute.path).toBe('/quote/upload-boundary')
    })

    it('should have a handler function', () => {
      expect(typeof getRoute.handler).toBe('function')
    })
  })
})
