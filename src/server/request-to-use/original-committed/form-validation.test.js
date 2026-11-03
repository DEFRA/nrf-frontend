import { describe, it, expect } from 'vitest'
import formValidation from './form-validation.js'

const errorMessage =
  'Select yes if the original planning permission was committed to using the nature restoration levy'

describe('original committed form validation', () => {
  describe('originalCommitted', () => {
    it.each(['yes', 'no'])('passes for "%s"', (value) => {
      const { error } = formValidation().validate({ originalCommitted: value })

      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = formValidation().validate({})

      expect(error.details[0].message).toBe(errorMessage)
    })

    it('fails for an unrecognised value', () => {
      const { error } = formValidation().validate({
        originalCommitted: 'maybe'
      })

      expect(error.details[0].message).toBe(errorMessage)
    })
  })
})
