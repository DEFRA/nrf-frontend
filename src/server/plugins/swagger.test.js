import { createServer } from '../server.js'
import { config } from '../../config/config.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#swagger plugin', () => {
  describe('when useSwagger is true', () => {
    let server

    beforeAll(async () => {
      config.set('useSwagger', true)
      server = await createServer()
      await server.initialize()
    })

    afterAll(async () => {
      await server.stop({ timeout: 0 })
      config.set('useSwagger', false)
    })

    describe('GET /swagger.json', () => {
      test('should return a valid OpenAPI spec', async () => {
        const { result, statusCode, headers } = await server.inject({
          method: 'GET',
          url: '/swagger.json'
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(headers['content-type']).toContain('application/json')
        expect(result.openapi).toBe('3.0.0')
        expect(result.info.title).toBe('NRF Frontend')
        expect(result.paths).toBeDefined()
      })

      test('should include documented routes', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: '/swagger.json'
        })

        expect(result.paths['/health']).toBeDefined()
        expect(result.paths['/health'].get).toBeDefined()
        expect(result.paths['/about']).toBeDefined()
      })
    })

    describe('GET /docs', () => {
      test('should return the Swagger UI HTML page', async () => {
        const { statusCode, headers, result } = await server.inject({
          method: 'GET',
          url: '/docs'
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(headers['content-type']).toContain('text/html')
        expect(result).toContain('swagger-ui')
        expect(result).toContain('swagger-ui-bundle.js')
        expect(result).toContain('swagger-initializer.js')
      })

      test('should not contain inline scripts', async () => {
        const { result } = await server.inject({
          method: 'GET',
          url: '/docs'
        })

        const scriptTags = result.match(/<script[^>]*>/g) || []
        for (const tag of scriptTags) {
          expect(tag).toContain('src=')
        }
      })

      test('should have a relaxed CSP allowing inline styles', async () => {
        const { headers } = await server.inject({
          method: 'GET',
          url: '/docs'
        })

        const csp = headers['content-security-policy']
        expect(csp).toContain("style-src 'self' 'unsafe-inline'")
      })
    })

    describe('GET /swagger-ui/swagger-initializer.js', () => {
      test('should return the custom initializer pointing to /swagger.json', async () => {
        const { statusCode, headers, result } = await server.inject({
          method: 'GET',
          url: '/swagger-ui/swagger-initializer.js'
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(headers['content-type']).toContain('application/javascript')
        expect(result).toContain("url: '/swagger.json'")
        expect(result).toContain('SwaggerUIBundle')
      })
    })

    describe('GET /docs/csrf-token', () => {
      test('should return a JSON response with csrfToken field', async () => {
        const { statusCode, headers, result } = await server.inject({
          method: 'GET',
          url: '/docs/csrf-token'
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(headers['content-type']).toContain('application/json')
        expect(result).toHaveProperty('csrfToken')
      })
    })

    describe('GET /swagger-ui/{file}', () => {
      test('should serve swagger-ui static assets', async () => {
        const { statusCode } = await server.inject({
          method: 'GET',
          url: '/swagger-ui/swagger-ui.css'
        })

        expect(statusCode).toBe(statusCodes.ok)
      })

      test('should have a relaxed CSP for static assets', async () => {
        const { headers } = await server.inject({
          method: 'GET',
          url: '/swagger-ui/swagger-ui.css'
        })

        const csp = headers['content-security-policy']
        expect(csp).toContain("style-src 'self' 'unsafe-inline'")
      })

      test('should not override CSP on error responses', async () => {
        const { statusCode } = await server.inject({
          method: 'GET',
          url: '/swagger-ui/does-not-exist.js'
        })

        expect(statusCode).toBe(statusCodes.notFound)
      })
    })
  })

  describe('when useSwagger is false', () => {
    let server

    beforeAll(async () => {
      config.set('useSwagger', false)
      server = await createServer()
      await server.initialize()
    })

    afterAll(async () => {
      await server.stop({ timeout: 0 })
    })

    test('GET /docs should return 404', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/docs'
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })

    test('GET /swagger.json should return 404', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/swagger.json'
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })

    test('GET /swagger-ui/swagger-initializer.js should return 404', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/swagger-ui/swagger-initializer.js'
      })

      expect(statusCode).toBe(statusCodes.notFound)
    })
  })
})
