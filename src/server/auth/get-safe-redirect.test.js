import { getSafeRedirect } from './get-safe-redirect.js'
import { routePath as startPath } from '../manage/start-page/routes.js'

describe('#getSafeRedirect', () => {
  it.each([
    ['a relative path', '/profile'],
    ['a relative path with a query string', '/profile?tab=orgs']
  ])('returns %s unchanged', (_, redirect) => {
    expect(getSafeRedirect(redirect)).toBe(redirect)
  })

  it.each([
    ['nothing is given', undefined],
    ['the value is not a string', ['/profile']],
    ['the value is an absolute URL', 'https://example.com/profile'],
    ['the value is protocol-relative', '//example.com'],
    ['the value is protocol-relative with a backslash', '/\\example.com'],
    [
      'the value hides a protocol-relative URL behind encoding',
      '/%2F%2Fexample.com'
    ]
  ])('returns the start page when %s', (_, redirect) => {
    expect(getSafeRedirect(redirect)).toBe(startPath)
  })
})
