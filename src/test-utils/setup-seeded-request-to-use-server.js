import { createServer } from '../server/server.js'
import { ensureRedis } from './ensure-redis.js'
import { requestToUseSession } from '../server/request-to-use/helpers/request-to-use-session/index.js'
import { fullQuote } from './fixtures/quote.js'

let seededServer = null
let initPromise = null

async function getSeededServer() {
  if (seededServer) return seededServer
  if (initPromise) return initPromise

  initPromise = (async () => {
    await ensureRedis()
    const server = await createServer()
    // Seeds requestToUse after every response, so tests using this server can
    // never exercise the missing-requestToUse path: that runs against
    // setupTestServer instead (see the redirect tests in review-quote-details).
    server.ext('onPostHandler', (request, h) => {
      requestToUseSession.save(request, { nrlReference: fullQuote.reference })
      return h.continue
    })
    await server.initialize()
    seededServer = server
    return seededServer
  })()

  return initPromise
}

export const setupSeededRequestToUseServer = () => {
  let server

  beforeAll(async () => {
    server = await getSeededServer()
  })

  return () => server
}
