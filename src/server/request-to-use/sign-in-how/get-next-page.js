import { routeOneLoginEmailAddress } from '../one-login-email-address/routes.js'
import { routeSignInGovGateway } from '../sign-in-gov-gateway/routes.js'

export default function getNextPage({ signInHow }) {
  return signInHow === 'gov-uk-one'
    ? routeOneLoginEmailAddress
    : routeSignInGovGateway
}
