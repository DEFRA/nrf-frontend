import { isPrefetchRequest } from './is-prefetch-request.js'

describe('isPrefetchRequest', () => {
  it('is false for a real human click (Sec-Fetch-User: ?1)', () => {
    expect(isPrefetchRequest({ headers: { 'sec-fetch-user': '?1' } })).toBe(
      false
    )
  })

  it('is true when Sec-Fetch-User is absent', () => {
    expect(isPrefetchRequest({ headers: {} })).toBe(true)
  })

  it('is true when Sec-Fetch-User has any other value', () => {
    expect(isPrefetchRequest({ headers: { 'sec-fetch-user': '?0' } })).toBe(
      true
    )
  })
})
