import { createServer } from '../server.js'
import { routePath as startPagePath } from './start-page/routes.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#rootRedirect', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('should redirect / to the start page', async () => {
    const { statusCode, headers } = await server.inject({
      method: 'GET',
      url: '/'
    })

    expect(statusCode).toBe(statusCodes.found)
    expect(headers.location).toBe(startPagePath)
  })
})
