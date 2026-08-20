import { createServer } from '../server/server.js'
import { ensureRedis } from './ensure-redis.js'

let sharedServer = null
let initPromise = null

async function getSharedServer() {
  if (sharedServer) return sharedServer
  if (initPromise) return initPromise

  initPromise = (async () => {
    await ensureRedis()
    // createServer's onPreStart gate waits for the Redis client to be ready, so
    // server.initialize() only resolves once the session cache is connected.
    const server = await createServer()
    await server.initialize()
    sharedServer = server
    return sharedServer
  })()

  return initPromise
}

export const setupTestServer = () => {
  let server

  beforeAll(async () => {
    server = await getSharedServer()
  })

  return () => server
}
