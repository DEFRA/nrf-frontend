import { routePath as enterAddressPath } from '../enter-address/route-path.js'

/**
 * Every answer goes to enter address for now: the per-user-type Defra account
 * pages are not built yet. Enter address requires sign-in, so this is also
 * where a signed-out user is sent to Defra ID.
 * @returns {string} path of the page to redirect to
 */
export default function getNextPage() {
  return enterAddressPath
}
