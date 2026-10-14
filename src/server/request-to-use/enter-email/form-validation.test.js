import { describe, it, expect } from 'vitest'
import formValidation from './form-validation.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const missingMessage = 'Enter your email address'
const formatMessage =
  'Enter an email address in the correct format, like name@example.com'
const spacesMessage = 'Email address must not contain spaces'
const tooLongMessage = 'Email address must be 254 characters or less'
const validEmail = fullQuote.email.address

describe('enter-email form validation', () => {
  describe('email', () => {
    it('passes for a valid email address', () => {
      const result = formValidation().validate({ email: validEmail })
      expect(result.error).toBeUndefined()
      expect(result.value).toEqual({ email: validEmail })
    })

    it('trims surrounding whitespace', () => {
      const result = formValidation().validate({ email: `  ${validEmail}\t` })
      expect(result.error).toBeUndefined()
      expect(result.value).toEqual({ email: validEmail })
    })

    it.each([
      { scenario: 'absent', payload: {} },
      { scenario: 'empty', payload: { email: '' } },
      { scenario: 'only whitespace', payload: { email: '   ' } }
    ])('fails with the missing message when $scenario', ({ payload }) => {
      const { error } = formValidation().validate(payload)
      expect(error.details[0].message).toBe(missingMessage)
    })

    it.each([
      'testemail.com',
      'test@',
      '@domain.com',
      'test@domain..com',
      'test@@domain.com'
    ])('fails with the format message for %j', (email) => {
      const { error } = formValidation().validate({ email })
      expect(error.details[0].message).toBe(formatMessage)
    })

    it('fails with the spaces message when the address contains spaces', () => {
      const { error } = formValidation().validate({ email: 'test @domain.com' })
      expect(error.details[0].message).toBe(spacesMessage)
    })

    it('fails when the address is longer than 254 characters', () => {
      const { error } = formValidation().validate({
        email: `${'a'.repeat(248)}@test.com`
      })
      expect(error.details[0].message).toBe(tooLongMessage)
    })
  })
})
