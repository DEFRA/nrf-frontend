import joi from 'joi'
import { emailField, emailErrorMessages, maxEmailLength } from './email.js'

const validate = (schema, value) =>
  joi.object({ email: schema }).validate({ email: value })

describe('emailField', () => {
  it('accepts a well-formed email', () => {
    const { error } = validate(emailField(), 'person@example.com')
    expect(error).toBeUndefined()
  })

  it('accepts a reserved-TLD email (tlds allow disabled)', () => {
    const { error } = validate(emailField(), 'person@nowhere.example')
    expect(error).toBeUndefined()
  })

  it('trims surrounding whitespace', () => {
    const { value } = validate(emailField(), '  person@example.com  ')
    expect(value.email).toBe('person@example.com')
  })

  it('rejects a missing email with the required message', () => {
    const { error } = validate(emailField(), '')
    expect(error.message).toBe(emailErrorMessages.required)
  })

  it('rejects a malformed email with the format message', () => {
    const { error } = validate(emailField(), 'not-an-email')
    expect(error.message).toBe(emailErrorMessages.format)
  })

  it('rejects an over-length email with the max-length message', () => {
    const longLocal = 'a'.repeat(maxEmailLength)
    const { error } = validate(emailField(), `${longLocal}@example.com`)
    expect(error.message).toBe(emailErrorMessages.maxLength)
  })

  describe('with noSpaces', () => {
    it('rejects an email containing spaces with the spaces message', () => {
      const { error } = validate(
        emailField({ noSpaces: true }),
        'a b@example.com'
      )
      expect(error.message).toBe(emailErrorMessages.spaces)
    })

    it('still accepts a well-formed email', () => {
      const { error } = validate(
        emailField({ noSpaces: true }),
        'person@example.com'
      )
      expect(error).toBeUndefined()
    })
  })
})
