import { describe, it, expect } from 'vitest'
import joi from 'joi'
import { createPlainIntegerValidator } from './number-validators.js'

describe('createPlainIntegerValidator', () => {
  const validator = createPlainIntegerValidator({ min: 1, max: 100 })
  const schema = joi.any().custom(validator).messages({
    'any.required': 'Field is required',
    'number.format': 'Enter a number using digits only',
    'number.integer': 'Enter a whole number',
    'number.min': 'Number too small',
    'number.max': 'Number too large'
  })

  describe('valid inputs', () => {
    it.each([
      ['accepts minimum value', 1, 1],
      ['accepts a valid integer', 6, 6],
      ['accepts maximum value', 100, 100]
    ])('%s', (_description, input, expected) => {
      const { error, value } = schema.validate(input)
      expect(error).toBeUndefined()
      expect(value).toBe(expected)
    })

    it.each([
      ['accepts a string number', '12', 12],
      ['accepts a string with leading/trailing spaces (trimmed)', ' 12 ', 12],
      ['accepts a string with spaces between digits (1 2)', '1 2', 12],
      [
        'accepts a string with multiple spaces between digits (1  4)',
        '1  4',
        14
      ],
      [
        'accepts a string with spaces before, after, and between digits',
        '  1 2  ',
        12
      ],
      ['accepts a string with a thousand-separator comma (1,2)', '1,2', 12],
      ['accepts a string with multiple commas (1,0,0)', '1,0,0', 100],
      ['accepts a leading comma (,12)', ',12', 12],
      ['accepts a trailing comma (12,)', '12,', 12]
    ])('%s', (_description, input, expected) => {
      const { error, value } = schema.validate(input)
      expect(error).toBeUndefined()
      expect(value).toBe(expected)
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

    it('fails when a comma-separated value exceeds the maximum once stripped', () => {
      const { error } = schema.validate('1,000')
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

    it('fails for negative decimal', () => {
      const { error } = schema.validate('-3.5')
      expect(error.details[0].message).toBe('Enter a whole number')
    })
  })

  describe('invalid formats', () => {
    it.each([
      ['fails for non-numeric characters', 'abc'],
      ['fails for text with units', '25 units'],
      ['fails for scientific notation', '1e3'],
      ['fails for plus sign', '+10']
    ])('%s', (_description, input) => {
      const { error } = schema.validate(input)
      expect(error.details[0].message).toBe('Enter a number using digits only')
    })

    it('fails for minus sign', () => {
      const { error } = schema.validate('-10')
      expect(error.details[0].message).toBe('Number too small')
    })
  })
})
