import { createServer } from '../server/server.js'
import { ensureRedis } from './ensure-redis.js'
import { requestToUseKey } from '../server/common/helpers/journey-session/index.js'
import { fullQuote } from './fixtures/quote.js'

let seededServer = null
let initPromise = null

async function getSeededServer() {
  if (seededServer) return seededServer
  if (initPromise) return initPromise

  initPromise = (async () => {
    await ensureRedis()
    const server = await createServer()
    // Stand-in for the magic link redemption writer (NRF2-1256, not built
    // yet): seeds the requestToUse session key after every response so pages
    // guarded on it render. The write lands before the session is committed,
    // so it persists to the next request. Delete this module when that ticket
    // lands.
    server.ext('onPostHandler', (request, h) => {
      request.yar.set(requestToUseKey, { nrlReference: fullQuote.reference })
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
