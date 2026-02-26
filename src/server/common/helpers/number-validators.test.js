import { describe, it, expect } from 'vitest'
import joi from 'joi'
import { createPlainIntegerValidator } from './number-validators.js'

describe('createPlainIntegerValidator', () => {
  const validator = createPlainIntegerValidator({ min: 1, max: 100 })
  const schema = joi.any().custom(validator).messages({
    'any.required': 'Field is required',
    'number.base': 'Enter a valid number',
    'number.integer': 'Enter a whole number',
    'number.min': 'Number too small',
    'number.max': 'Number too large'
  })

  describe('valid inputs', () => {
    it('accepts a valid integer', () => {
      const { error, value } = schema.validate(6)
      expect(error).toBeUndefined()
      expect(value).toBe(6)
    })

    it('accepts a string number', () => {
      const { error, value } = schema.validate('12')
      expect(error).toBeUndefined()
      expect(value).toBe(12)
    })

    it('accepts a string with spaces (trimmed)', () => {
      const { error, value } = schema.validate(' 12 ')
      expect(error).toBeUndefined()
      expect(value).toBe(12)
    })

    it('accepts minimum value', () => {
      const { error, value } = schema.validate(1)
      expect(error).toBeUndefined()
      expect(value).toBe(1)
    })

    it('accepts maximum value', () => {
      const { error, value } = schema.validate(100)
      expect(error).toBeUndefined()
      expect(value).toBe(100)
    })
  })

  describe('empty or missing input', () => {
    it('fails when empty string', () => {
      const { error } = schema.validate('')
      expect(error.details[0].message).toBe('Field is required')
    })
  })

  describe('out of range', () => {
    it('fails when below minimum', () => {
      const { error } = schema.validate(0)
      expect(error.details[0].message).toBe('Number too small')
    })

    it('fails when above maximum', () => {
      const { error } = schema.validate(101)
      expect(error.details[0].message).toBe('Number too large')
    })
  })

  describe('decimal numbers', () => {
    it('fails for decimal number', () => {
      const { error } = schema.validate(3.5)
      expect(error.details[0].message).toBe('Enter a whole number')
    })

    it('fails for string decimal', () => {
      const { error } = schema.validate('3.5')
      expect(error.details[0].message).toBe('Enter a whole number')
    })
  })

  describe('invalid formats', () => {
    it('fails for non-numeric characters', () => {
      const { error } = schema.validate('abc')
      expect(error.details[0].message).toBe('Enter a valid number')
    })

    it('fails for text with units', () => {
      const { error } = schema.validate('25 units')
      expect(error.details[0].message).toBe('Enter a valid number')
    })

    it('fails for comma separator', () => {
      const { error } = schema.validate('1,000')
      expect(error.details[0].message).toBe('Enter a valid number')
    })

    it('fails for scientific notation', () => {
      const { error } = schema.validate('1e3')
      expect(error.details[0].message).toBe('Enter a valid number')
    })

    it('fails for plus sign', () => {
      const { error } = schema.validate('+10')
      expect(error.details[0].message).toBe('Enter a valid number')
    })

    it('fails for minus sign', () => {
      const { error } = schema.validate('-10')
      expect(error.details[0].message).toBe('Enter a valid number')
    })
  })
})
