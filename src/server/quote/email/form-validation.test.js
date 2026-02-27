import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('email form validation', () => {
  describe('email', () => {
    it('passes for a valid email', () => {
      const { error } = getSchema().validate({ email: 'test@example.com' })
      expect(error).toBeUndefined()
    })

    it('passes for an uppercase email', () => {
      const { error } = getSchema().validate({ email: 'USER@EXAMPLE.COM' })
      expect(error).toBeUndefined()
    })

    it('passes for an email with subdomain', () => {
      const { error } = getSchema().validate({
        email: 'user.name@test.co.uk'
      })
      expect(error).toBeUndefined()
    })

    it('passes for an email with plus tag', () => {
      const { error } = getSchema().validate({ email: 'user+tag@test.com' })
      expect(error).toBeUndefined()
    })

    it('passes for an email with underscore', () => {
      const { error } = getSchema().validate({ email: 'user_name@test.io' })
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
      expect(error.details[0].message).toBe('Enter an email address')
    })

    it('fails when empty string', () => {
      const { error } = getSchema().validate({ email: '' })
      expect(error.details[0].message).toBe('Enter an email address')
    })

    it('fails for invalid format - no @ symbol', () => {
      const { error } = getSchema().validate({ email: 'testemail.com' })
      expect(error.details[0].message).toBe(
        'Enter an email address in the correct format, like name@example.com'
      )
    })

    it('fails for invalid format - no domain', () => {
      const { error } = getSchema().validate({ email: 'test@' })
      expect(error.details[0].message).toBe(
        'Enter an email address in the correct format, like name@example.com'
      )
    })

    it('fails for invalid format - no local part', () => {
      const { error } = getSchema().validate({ email: '@domain.com' })
      expect(error.details[0].message).toBe(
        'Enter an email address in the correct format, like name@example.com'
      )
    })

    it('fails for invalid format - no TLD', () => {
      const { error } = getSchema().validate({ email: 'test@domain' })
      expect(error.details[0].message).toBe(
        'Enter an email address in the correct format, like name@example.com'
      )
    })

    it('fails for invalid format - space in email', () => {
      const { error } = getSchema().validate({ email: 'test @domain.com' })
      expect(error.details[0].message).toBe(
        'Email address must not contain spaces'
      )
    })

    it('fails for invalid format - double dots in domain', () => {
      const { error } = getSchema().validate({ email: 'test@domain..com' })
      expect(error.details[0].message).toBe(
        'Enter an email address in the correct format, like name@example.com'
      )
    })

    it('fails for invalid format - double @ symbol', () => {
      const { error } = getSchema().validate({ email: 'test@@domain.com' })
      expect(error.details[0].message).toBe(
        'Enter an email address in the correct format, like name@example.com'
      )
    })

    it('fails for invalid format - comma instead of dot', () => {
      const { error } = getSchema().validate({ email: 'test@domain,com' })
      expect(error.details[0].message).toBe(
        'Enter an email address in the correct format, like name@example.com'
      )
    })

    it('fails for invalid format - space in domain', () => {
      const { error } = getSchema().validate({ email: 'test@domain com' })
      expect(error.details[0].message).toBe(
        'Email address must not contain spaces'
      )
    })

    it('fails when email exceeds maximum length', () => {
      const longEmail = 'a'.repeat(250) + '@test.com'
      const { error } = getSchema().validate({ email: longEmail })
      expect(error.details[0].message).toBe(
        'Email address must be 256 characters or less'
      )
    })
  })
})
