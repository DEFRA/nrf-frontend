import { buildNavigation } from './build-navigation.js'

describe('#buildNavigation', () => {
  test('Should provide no navigation items when signed out', () => {
    expect(buildNavigation({ path: '/non-existent-path' })).toEqual([])
  })

  test('Should provide a sign out link when signed in', () => {
    expect(
      buildNavigation({ auth: { credentials: { isAuthenticated: true } } })
    ).toEqual([{ text: 'Sign out', href: '/auth/sign-out' }])
  })
})
