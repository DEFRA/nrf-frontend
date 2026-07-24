import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('email form validation', () => {
  describe('email', () => {
    it.each([
      ['passes for a valid email', 'test@example.com'],
      ['passes for an uppercase email', 'USER@EXAMPLE.COM'],
      ['passes for an email with subdomain', 'user.name@test.co.uk'],
      ['passes for an email with plus tag', 'user+tag@test.com'],
      ['passes for an email with underscore', 'user_name@test.io']
    ])('%s', (_description, email) => {
      const { error } = getSchema().validate({ email })
      expect(error).toBeUndefined()
    })

    it('trims whitespace from email', () => {
      const { error, value } = getSchema().validate({
        email: '  test@example.com  '
      })
      expect(error).toBeUndefined()
      expect(value.email).toBe('test@example.com')
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe('Enter your email address')
    })

    it('fails when empty string', () => {
      const { error } = getSchema().validate({ email: '' })
      expect(error.details[0].message).toBe('Enter your email address')
    })

    it.each([
      [
        'fails for invalid format - no @ symbol',
        'testemail.com',
        'Enter an email address in the correct format, like name@example.com'
      ],
      [
        'fails for invalid format - no domain',
        'test@',
        'Enter an email address in the correct format, like name@example.com'
      ],
      [
        'fails for invalid format - no local part',
        '@domain.com',
        'Enter an email address in the correct format, like name@example.com'
      ],
      [
        'fails for invalid format - no TLD',
        'test@domain',
        'Enter an email address in the correct format, like name@example.com'
      ],
      [
        'fails for invalid format - space in email',
        'test @domain.com',
        'Email address must not contain spaces'
      ],
      [
        'fails for invalid format - double dots in domain',
        'test@domain..com',
        'Enter an email address in the correct format, like name@example.com'
      ],
      [
        'fails for invalid format - double @ symbol',
        'test@@domain.com',
        'Enter an email address in the correct format, like name@example.com'
      ],
      [
        'fails for invalid format - comma instead of dot',
        'test@domain,com',
        'Enter an email address in the correct format, like name@example.com'
      ],
      [
        'fails for invalid format - space in domain',
        'test@domain com',
        'Email address must not contain spaces'
      ]
    ])('%s', (_description, email, expectedMessage) => {
      const { error } = getSchema().validate({ email })
      expect(error.details[0].message).toBe(expectedMessage)
    })

    it('fails when email exceeds maximum length', () => {
      const longEmail = 'a'.repeat(248) + '@test.com'
      const { error } = getSchema().validate({ email: longEmail })
      expect(error.details[0].message).toBe(
        'Email address must be 254 characters or less'
      )
    })
  })
})
