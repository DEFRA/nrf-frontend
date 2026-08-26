import { ensureRedis } from '../src/test-utils/ensure-redis.js'

export default async function setup() {
  await ensureRedis()

  // Point nrf-backend at a dead port so tests never hit a locally running backend.
  // Tests that need to assert on backend calls mock this URL with MSW instead.
  process.env.NRF_BACKEND_API_URL = 'http://127.0.0.1:9'
}
