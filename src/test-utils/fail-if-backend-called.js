import { http } from 'msw'
import { config } from '../config/config.js'

/**
 * Registers MSW handlers that fail the test if the app requests any of the
 * given backend endpoints — for asserting a page rejects bad input before
 * making a backend call.
 * @param {object} mswServer - server from setupMswServer()
 * @param {string[]} endpointPaths - backend endpoint paths that must not be
 * requested, e.g. ['/quotes', '/quotes/']
 */
export const failIfBackendCalled = (mswServer, endpointPaths) => {
  const apiUrl = config.get('backend').apiUrl
  mswServer.use(
    ...endpointPaths.map((endpointPath) =>
      http.get(`${apiUrl}${endpointPath}`, () => {
        throw new Error(`backend should not have been called: ${endpointPath}`)
      })
    )
  )
}
