import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('upload-boundary form validation', () => {
  describe('file', () => {
    it('passes when a file is provided', () => {
      const { error } = getSchema().validate({
        file: { hapi: { filename: 'boundary.geojson' } }
      })
      expect(error).toBeUndefined()
    })

    it('fails when no file is provided', () => {
      const { error } = getSchema().validate({})
      expect(error.details[0].message).toBe('Select a file')
    })
  })
})
