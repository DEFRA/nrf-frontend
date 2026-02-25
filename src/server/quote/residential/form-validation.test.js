import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('residential form validation', () => {
  describe('residentialBuildingCount', () => {
    it('passes for a valid integer', () => {
      const { error } = getSchema().validate({ residentialBuildingCount: 10 })
      expect(error).toBeUndefined()
    })

    it('passes for zero', () => {
      const { error } = getSchema().validate({ residentialBuildingCount: 0 })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe(
        'Enter the number of residential units'
      )
    })

    it('fails when empty string', () => {
      const { error } = getSchema().validate({ residentialBuildingCount: '' })
      expect(error.details[0].message).toBe(
        'Enter the number of residential units'
      )
    })

    it('fails when non-numeric', () => {
      const { error } = getSchema().validate({
        residentialBuildingCount: 'abc'
      })
      expect(error.details[0].message).toBe(
        'Enter the number of residential units'
      )
    })

    it('fails when a decimal number', () => {
      const { error } = getSchema().validate({
        residentialBuildingCount: 10.5
      })
      expect(error.details[0].message).toBe('Enter a whole number')
    })
  })
})
