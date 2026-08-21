// Both sign-in methods are handled by DEFRA Identity — the chosen method is
// saved to the session cache, then the user is sent to the OIDC sign-in flow
const routeAuthSignIn = '/auth/sign-in'

export default function getNextPage({ howDoYouWantToSignIn }) {
  return routeAuthSignIn
}
