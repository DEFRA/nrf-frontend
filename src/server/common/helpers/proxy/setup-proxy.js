import { ProxyAgent, setGlobalDispatcher } from 'undici'

import { createLogger } from '../logging/logger.js'
import { config } from '../../../../config/config.js'

const logger = createLogger()

/**
 * If HTTP_PROXY is set, setupProxy() will enable it globally
 * for all undici-based HTTP clients, including Node's built-in fetch.
 *
 * Node's built-in fetch (available since v18) uses undici internally.
 * Since we're on Node v24, setGlobalDispatcher() already applies to
 * the global fetch — no per-call ProxyAgent needed.
 */
export function setupProxy() {
  const proxyUrl = config.get('httpProxy')

  if (proxyUrl) {
    logger.info('setting up global proxies')

    // Undici proxy
    setGlobalDispatcher(new ProxyAgent(proxyUrl))
  }
}
