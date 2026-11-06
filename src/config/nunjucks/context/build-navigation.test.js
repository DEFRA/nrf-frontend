import { buildNavigation } from './build-navigation.js'

const signedOutRequest = { path: '/request-to-use/enter-address' }

describe('#buildNavigation', () => {
  it('Should provide no navigation items when signed out', () => {
    expect(buildNavigation(signedOutRequest)).toEqual([])
  })

  it.each([
    '/request-to-use/enter-address',
    '/request-to-use/check-your-answers',
    '/request-to-use/confirmation'
  ])('Should provide a sign out link on %s when signed in', (path) => {
    const request = { path, auth: { credentials: { isAuthenticated: true } } }

    expect(buildNavigation(request)).toEqual([
      { text: 'Sign out', href: '/auth/sign-out' }
    ])
  })

  it.each([
    '/manage/start-page',
    '/request-to-use/have-nrl-reference',
    '/request-to-use/enter-email',
    '/quote/planning-type'
  ])('Should provide no sign out link on %s when signed in', (path) => {
    const request = { path, auth: { credentials: { isAuthenticated: true } } }

    expect(buildNavigation(request)).toEqual([])
  })
})
