import { appendChangeParam, isChangeMode, isDropoutPage } from './index.js'

describe('change-mode helper', () => {
  describe('isChangeMode', () => {
    it('is true when the query carries change=true', () => {
      expect(isChangeMode({ change: 'true' })).toBe(true)
    })

    it.each([[{ change: 'false' }], [{}], [undefined]])(
      'is false for %s',
      (query) => {
        expect(isChangeMode(query)).toBe(false)
      }
    )
  })

  describe('isDropoutPage', () => {
    it.each([
      '/quote/application-type-not-available',
      '/quote/not-housing',
      '/quote/not-in-edp',
      '/quote/excluded-area'
    ])('identifies %s as a dropout page', (path) => {
      expect(isDropoutPage(path)).toBe(true)
    })

    it('does not identify a journey page as a dropout page', () => {
      expect(isDropoutPage('/quote/email')).toBe(false)
    })
  })

  describe('appendChangeParam', () => {
    it('appends ?change=true in change mode', () => {
      expect(
        appendChangeParam('/quote/planning-type', { change: 'true' })
      ).toBe('/quote/planning-type?change=true')
    })

    it('leaves the path unchanged outside change mode', () => {
      expect(appendChangeParam('/quote/planning-type', {})).toBe(
        '/quote/planning-type'
      )
    })

    it('treats any other change value as not in change mode', () => {
      expect(
        appendChangeParam('/quote/planning-type', { change: 'false' })
      ).toBe('/quote/planning-type')
    })

    it('tolerates a missing query', () => {
      expect(appendChangeParam('/quote/planning-type', undefined)).toBe(
        '/quote/planning-type'
      )
    })

    it('preserves an existing query string when appending the param', () => {
      expect(
        appendChangeParam('/quote/email?foo=bar', { change: 'true' })
      ).toBe('/quote/email?foo=bar&change=true')
    })
  })
})
