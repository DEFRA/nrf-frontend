import { describe, it, expect } from 'vitest'
import formValidation from './form-validation.js'

const errorMessage =
  'Select yes if you accept the nature restoration levy amount'

describe('accept-levy form validation', () => {
  describe('acceptLevy', () => {
    it.each(['yes', 'no'])('passes for "%s"', (value) => {
      const { error } = formValidation().validate({ acceptLevy: value })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = formValidation().validate({})
      expect(error.details[0].message).toBe(errorMessage)
    })

    it('fails for an unrecognised value', () => {
      const { error } = formValidation().validate({ acceptLevy: 'maybe' })
      expect(error.details[0].message).toBe(errorMessage)
    })
  })
})
