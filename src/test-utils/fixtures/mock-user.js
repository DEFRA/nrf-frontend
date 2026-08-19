// Claims the mock OIDC provider issues in its ID/access tokens, mirroring what
// nrf-frontend reads from the Defra ID token in its sign-in callback
export const mockUser = {
  sub: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  name: 'Test User'
}
