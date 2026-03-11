import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('delete-quote form validation', () => {
  describe('confirmDeleteQuote', () => {
    it('passes for "Yes"', () => {
      const { error } = getSchema().validate({ confirmDeleteQuote: 'Yes' })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = getSchema().validate({})
      expect(error).toBeDefined()
    })
  })
})
