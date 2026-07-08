import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

const errorMessage = 'Select a planning application type'

describe('planning-type form validation', () => {
  describe('planningType', () => {
    it.each([
      'full-planning-permission',
      'outline-planning-permission',
      'hybrid-planning-permission',
      'other'
    ])('passes for "%s"', (value) => {
      const { error } = getSchema().validate({ planningType: value })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe(errorMessage)
    })

    it('fails for an unrecognised value', () => {
      const { error } = getSchema().validate({ planningType: 'something-else' })
      expect(error.details[0].message).toBe(errorMessage)
    })
  })
})
