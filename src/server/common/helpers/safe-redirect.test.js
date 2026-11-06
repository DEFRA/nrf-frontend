import { getSafeRedirect, isSafeRedirect } from './safe-redirect.js'

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
    ['nothing is given', undefined],
    ['the value is not a string', ['/profile']],
    ['the value is an absolute URL', 'https://example.com/profile'],
    ['the value is protocol-relative', '//example.com'],
    ['the value is protocol-relative with a backslash', '/\\example.com'],
    [
      'the value is protocol-relative with an encoded backslash',
      '/%5Cexample.com'
    ],
    [
      'the value hides a protocol-relative URL behind encoding',
      '/%2F%2Fexample.com'
    ],
    [
      'the value hides a protocol-relative URL behind lowercase encoding',
      '/%2f%2fevil.example'
    ]
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

  it.each([
    ['an absolute URL', 'https://evil.example.com'],
    ['a protocol-relative URL', '//evil.example.com'],
    ['a backslash protocol-relative URL', '/\\evil.example.com'],
    ['an encoded backslash protocol-relative URL', '/%5Cevil.example.com'],
    ['an encoded protocol-relative URL', '/%2f%2fevil.example.com']
  ])('rejects %s', (_, redirect) => {
    expect(isSafeRedirect(redirect)).toBe(false)
  })
})
