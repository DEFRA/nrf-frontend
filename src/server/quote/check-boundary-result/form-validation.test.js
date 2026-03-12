import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('check-boundary-result form validation', () => {
  describe('boundaryCorrect', () => {
    it('passes for "yes"', () => {
      const { error } = getSchema().validate({ boundaryCorrect: 'yes' })
      expect(error).toBeUndefined()
    })

    it('passes for "no"', () => {
      const { error } = getSchema().validate({ boundaryCorrect: 'no' })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe('Select if the boundary is correct')
    })

    it('fails for an unrecognised value', () => {
      const { error } = getSchema().validate({
        boundaryCorrect: 'something-else'
      })
      expect(error.details[0].message).toBe('Select if the boundary is correct')
    })
  })
})
