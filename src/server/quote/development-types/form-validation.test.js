import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

const validationErrorMessage = 'Select a development type to continue'

describe('development-types form validation', () => {
  describe('developmentTypes', () => {
    it('passes for "housing"', () => {
      const { error } = getSchema().validate({ developmentTypes: 'housing' })
      expect(error).toBeUndefined()
    })

    it('passes for "other-residential"', () => {
      const { error } = getSchema().validate({
        developmentTypes: 'other-residential'
      })
      expect(error).toBeUndefined()
    })

    it('passes when multiple valid values are submitted', () => {
      const { error } = getSchema().validate({
        developmentTypes: ['housing', 'other-residential']
      })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe(validationErrorMessage)
    })

    it('fails for an unrecognised value', () => {
      const { error } = getSchema().validate({
        developmentTypes: 'something-else'
      })
      expect(error.details[0].message).toBe(validationErrorMessage)
    })
  })
})
