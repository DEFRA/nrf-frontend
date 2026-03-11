import { execSync } from 'node:child_process'
import { Redis } from 'ioredis'
import { config } from '../config/config.js'

const COMPOSE = 'docker compose -f compose.test.yml -p nrf-frontend-test'

export async function ensureRedis() {
  const client = new Redis({
    host: config.get('redis.host'),
    port: config.get('redis.port'),
    lazyConnect: true
  })

  try {
    await client.connect()
  } catch {
    execSync(`${COMPOSE} up -d redis --wait`, { stdio: 'inherit' })
    await client.connect()
  } finally {
    await client.quit()
  }
}
