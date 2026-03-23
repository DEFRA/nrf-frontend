import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#versionController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return version as unknown when GIT_HASH is not set', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/version'
    })

    expect(result).toEqual({ version: 'unknown' })
    expect(statusCode).toBe(statusCodes.ok)
  })
})
