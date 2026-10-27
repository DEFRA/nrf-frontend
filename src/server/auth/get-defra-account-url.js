import { config } from '../../config/config.js'
import { DEFRA_ID_ACCOUNT_PATH } from './auth-urls.js'

/**
 * @returns {string} absolute URL of the user's Defra ID account page
 */
export function getDefraAccountUrl() {
  return new URL(
    DEFRA_ID_ACCOUNT_PATH,
    config.get('defraId.baseUrl')
  ).toString()
}
