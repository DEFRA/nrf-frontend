import { describe, it, expect } from 'vitest'
import routes, { routePath } from './routes.js'

describe('upload-boundary routes', () => {
  it('should export the correct route path', () => {
    expect(routePath).toBe('/quote/upload-boundary')
  })

  it('should export an array of two routes', () => {
    expect(routes).toHaveLength(2)
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

  describe('POST route', () => {
    const postRoute = routes[1]

    it('should have method POST', () => {
      expect(postRoute.method).toBe('POST')
    })

    it('should have the correct path', () => {
      expect(postRoute.path).toBe('/quote/upload-boundary')
    })

    it('should have a handler function', () => {
      expect(typeof postRoute.handler).toBe('function')
    })

    it('should have multipart payload options for file upload', () => {
      expect(postRoute.options.payload).toEqual({
        output: 'stream',
        parse: true,
        multipart: true,
        maxBytes: 2 * 1024 * 1024
      })
    })

    it('should have validation configured', () => {
      expect(postRoute.options.validate).toBeDefined()
      expect(postRoute.options.validate.payload).toBeDefined()
      expect(typeof postRoute.options.validate.failAction).toBe('function')
    })
  })
})
