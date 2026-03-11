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

    test('Should serve assets as expected', async () => {
      // Note npm run build is ran in the postinstall hook in package.json to make sure there is always a file
      // available for this test. Remove as you see fit
      const { statusCode } = await getServer().inject({
        method: 'GET',
        url: '/public/assets/images/govuk-crest.svg'
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
