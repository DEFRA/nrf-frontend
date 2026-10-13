import { describe, it, expect } from 'vitest'
import formValidation from './form-validation.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const missingMessage = 'Enter your NRL reference'
const formatMessage =
  'Enter a NRL reference in the correct format, like NRL-123456'
const validReference = fullQuote.reference

describe('enter-nrl-reference form validation', () => {
  describe('nrlReference', () => {
    it.each([
      { scenario: 'a valid reference', value: validReference },
      { scenario: 'a lowercase reference', value: 'nrl-123456' },
      { scenario: 'surrounding whitespace', value: ` ${validReference}\t` }
    ])('passes and normalises $scenario', ({ value }) => {
      const result = formValidation().validate({ nrlReference: value })
      expect(result.error).toBeUndefined()
      expect(result.value).toEqual({ nrlReference: validReference })
    })

    it.each([
      { scenario: 'absent', payload: {} },
      { scenario: 'empty', payload: { nrlReference: '' } },
      { scenario: 'only whitespace', payload: { nrlReference: '  ' } }
    ])('fails with the missing message when $scenario', ({ payload }) => {
      const { error } = formValidation().validate(payload)
      expect(error.details[0].message).toBe(missingMessage)
    })

    it.each([
      'ABC-123',
      'NRL-12345',
      'NRL-1234567',
      'NRL123456',
      'NRL-12345A',
      'XNRL-123456',
      'NRL-123456 7',
      ['NRL-123456', 'NRL-654321']
    ])('fails with the format message for %j', (value) => {
      const { error } = formValidation().validate({ nrlReference: value })
      expect(error.details[0].message).toBe(formatMessage)
    })
  })
})
