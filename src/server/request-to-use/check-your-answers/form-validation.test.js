import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

const validRequiredData = { confirmInformation: 'Yes' }

describe('check your answers form validation', () => {
  describe('confirmInformation', () => {
    it('passes for each valid value', () => {
      const { error } = getSchema().validate(validRequiredData)
      expect(error).toBeUndefined()
    })

    it('fails with the correct message when absent', () => {
      const { error } = getSchema().validate({})
      expect(error).toBeDefined()
      expect(error.message).toBe(
        'Tick the box to confirm the information is true, accurate and complete'
      )
    })

    it('fails with the correct message for an unrecognised value', () => {
      const { error } = getSchema().validate({ confirmInformation: 'No' })
      expect(error).toBeDefined()
      expect(error.message).toBe(
        'Tick the box to confirm the information is true, accurate and complete'
      )
    })
  })
})
