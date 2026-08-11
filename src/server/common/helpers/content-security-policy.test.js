import { createServer } from '../../server.js'
import { routePath as startPath } from '../../manage/start-page/routes.js'

describe('#contentSecurityPolicy', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should set the CSP policy header', async () => {
    const resp = await server.inject({
      method: 'GET',
      url: startPath
    })

    expect(resp.headers['content-security-policy']).toBeDefined()
  })

  test('Should include base-uri self', async () => {
    const resp = await server.inject({ method: 'GET', url: startPath })
    expect(resp.headers['content-security-policy']).toContain("base-uri 'self'")
  })
})
