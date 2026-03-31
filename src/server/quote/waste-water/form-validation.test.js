import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('waste-water form validation', () => {
  describe('wasteWaterTreatmentWorks', () => {
    it('passes for a valid value', () => {
      const { error } = getSchema().validate({
        wasteWaterTreatmentWorks: 'great-billing-wrc'
      })
      expect(error).toBeUndefined()
    })

    it('passes for the i-dont-know option', () => {
      const { error } = getSchema().validate({
        wasteWaterTreatmentWorks: 'i-dont-know'
      })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe(
        'Select a waste water treatment works, or select that you do not know yet'
      )
    })

    it('fails when empty string', () => {
      const { error } = getSchema().validate({
        wasteWaterTreatmentWorks: ''
      })
      expect(error.details[0].message).toBe(
        'Select a waste water treatment works, or select that you do not know yet'
      )
    })
  })
})
