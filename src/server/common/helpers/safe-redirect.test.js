import { getSafeRedirect, isSafeRedirect } from './safe-redirect.js'
import { unsafeRedirectUrls } from '../../../test-utils/fixtures/unsafe-redirect-urls.js'

const startPath = '/manage/start-page'

describe('#getSafeRedirect', () => {
  it.each([
    ['a relative path', '/profile'],
    ['a relative path with a query string', '/profile?tab=orgs'],
    ['the cookies route', '/cookies'],
    ['the start page with a query string', '/manage/start-page?x=1']
  ])('returns %s unchanged', (_, redirect) => {
    expect(getSafeRedirect(redirect)).toBe(redirect)
  })

  it.each([
    ...unsafeRedirectUrls,
    [
      'the value hides a protocol-relative URL behind uppercase encoding',
      '/%2F%2Fexample.com'
    ],
    ['nothing is given', undefined],
    ['the value is not a string', ['/profile']]
  ])('returns the start page when %s', (_, redirect) => {
    expect(getSafeRedirect(redirect)).toBe(startPath)
  })
})

describe('#isSafeRedirect', () => {
  it.each([['/profile'], ['/cookies'], ['/manage/start-page?x=1']])(
    'accepts %s',
    (redirect) => {
      expect(isSafeRedirect(redirect)).toBe(true)
    }
  )

  it.each(unsafeRedirectUrls)('rejects %s', (_, redirect) => {
    expect(isSafeRedirect(redirect)).toBe(false)
  })
})
