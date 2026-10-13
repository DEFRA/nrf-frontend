import { describe, it, expect } from 'vitest'
import formValidation from './form-validation.js'

const errorMessage = 'Select yes if you have an NRL reference'

describe('have-nrl-reference form validation', () => {
  describe('hasNrlReference', () => {
    it.each(['yes', 'no'])('passes for "%s"', (value) => {
      const { error } = formValidation().validate({ hasNrlReference: value })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = formValidation().validate({})
      expect(error.details[0].message).toBe(errorMessage)
    })

    it('fails for an unrecognised value', () => {
      const { error } = formValidation().validate({
        hasNrlReference: 'maybe'
      })
      expect(error.details[0].message).toBe(errorMessage)
    })
  })
})
