import { ensureRedis } from '../src/test-utils/ensure-redis.js'

export default async function setup() {
  await ensureRedis()
}
