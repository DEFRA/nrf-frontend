import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

const errorMessage = 'Select a planning application type'

describe('planning-type form validation', () => {
  describe('planningType', () => {
    it('passes for "full-planning-permission"', () => {
      const { error } = getSchema().validate({
        planningType: 'full-planning-permission'
      })
      expect(error).toBeUndefined()
    })

    it('passes for "outline-planning-permission"', () => {
      const { error } = getSchema().validate({
        planningType: 'outline-planning-permission'
      })
      expect(error).toBeUndefined()
    })

    it('passes for "hybrid-planning-permission"', () => {
      const { error } = getSchema().validate({
        planningType: 'hybrid-planning-permission'
      })
      expect(error).toBeUndefined()
    })

    it('passes for "other"', () => {
      const { error } = getSchema().validate({ planningType: 'other' })
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
