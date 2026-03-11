import { statusCodes } from '../constants/status-codes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'

describe('#serveStaticFiles', () => {
  describe('When secure context is disabled', () => {
    const getServer = setupTestServer()

    test('Should serve favicon as expected', async () => {
      const { statusCode } = await getServer().inject({
        method: 'GET',
        url: '/favicon.ico'
      })

      expect(statusCode).toBe(statusCodes.noContent)
    })

  })
})
