import Joi from 'joi'

import { AUTH_STRATEGY_NAME } from './auth-urls.js'

const rulesSchema = Joi.object({ requireAuth: Joi.boolean() })

/**
 * Teaches Hapi a `rules: { requireAuth: true }` route setting that protects the
 * route with the Defra ID session strategy. Must be called on the root server
 * before any routes are registered. Whether auth is enabled is read when each
 * route is registered, so the strategy is only referenced if it actually exists;
 * otherwise the route is left open (the sign-in redirect is then unavailable).
 * @param {import('@hapi/hapi').Server} server - Root Hapi server
 */
export function registerAuthRules(server) {
  server.rules(
    function authRulesProcessor(rules) {
      if (!rules?.requireAuth) {
        return undefined
      }
      return { auth: server.app.authEnabled ? AUTH_STRATEGY_NAME : false }
    },
    { validate: { schema: rulesSchema } }
  )
}
