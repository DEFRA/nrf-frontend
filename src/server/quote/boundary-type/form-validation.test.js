import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('boundary-type form validation', () => {
  describe('boundaryEntryType', () => {
    it('passes for "draw"', () => {
      const { error } = getSchema().validate({ boundaryEntryType: 'draw' })
      expect(error).toBeUndefined()
    })

    it('passes for "upload"', () => {
      const { error } = getSchema().validate({ boundaryEntryType: 'upload' })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe(
        'Select how you would like to show your red line boundary'
      )
    })

    it('fails for an unrecognised value', () => {
      const { error } = getSchema().validate({
        boundaryEntryType: 'something-else'
      })
      expect(error.details[0].message).toBe(
        'Select how you would like to show your red line boundary'
      )
    })
  })
})
