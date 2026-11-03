import { describe, it, expect } from 'vitest'
import formValidation from './form-validation.js'

const errorMessage =
  'Select yes if the development is an amendment to an existing planning permission'

describe('variation form validation', () => {
  describe('variation', () => {
    it.each(['yes', 'no'])('passes for "%s"', (value) => {
      const { error } = formValidation().validate({ variation: value })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = formValidation().validate({})
      expect(error.details[0].message).toBe(errorMessage)
    })

    it('fails for an unrecognised value', () => {
      const { error } = formValidation().validate({ variation: 'maybe' })
      expect(error.details[0].message).toBe(errorMessage)
    })
  })
})
