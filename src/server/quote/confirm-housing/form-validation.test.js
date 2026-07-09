import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('confirm-housing form validation', () => {
  describe('isHousing', () => {
    it('passes for "yes"', () => {
      const { error } = getSchema().validate({ isHousing: 'yes' })
      expect(error).toBeUndefined()
    })

    it('passes for "no"', () => {
      const { error } = getSchema().validate({ isHousing: 'no' })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe(
        'Select yes if you are developing housing'
      )
    })

    it('fails for an unrecognised value', () => {
      const { error } = getSchema().validate({ isHousing: 'maybe' })
      expect(error.details[0].message).toBe(
        'Select yes if you are developing housing'
      )
    })
  })
})
