import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('units form validation', () => {
  describe('housingUnits', () => {
    describe('valid inputs', () => {
      it.each([
        ['a valid integer', 6],
        ['the minimum allowed value', 1],
        ['the maximum allowed value', 50000]
      ])('passes for %s (%s)', (_description, input) => {
        const { error } = getSchema().validate({ housingUnits: input })
        expect(error).toBeUndefined()
      })

      it('passes for a string number that gets converted (12)', () => {
        const { error } = getSchema().validate({
          housingUnits: '12'
        })
        expect(error).toBeUndefined()
      })

      it('passes for a string with leading/trailing spaces that gets trimmed ("12 ")', () => {
        const { error } = getSchema().validate({
          housingUnits: ' 12 '
        })
        expect(error).toBeUndefined()
      })

      it.each([
        ['spaces between digits', '3 4  5', 345],
        ['a thousand-separator comma', '1,000', 1000],
        ['the maximum allowed value with thousand separators', '50,000', 50000]
      ])(
        'passes for a string with %s (%s)',
        (_description, input, expected) => {
          const { error, value } = getSchema().validate({ housingUnits: input })
          expect(error).toBeUndefined()
          expect(value.housingUnits).toBe(expected)
        }
      )
    })

    describe('empty or missing input', () => {
      it('fails when absent', () => {
        const { error } = getSchema().validate({})
        expect(error.details[0].message).toBe(
          'Enter the number of housing units'
        )
      })

      it('fails when empty string', () => {
        const { error } = getSchema().validate({ housingUnits: '' })
        expect(error.details[0].message).toBe(
          'Enter the number of housing units'
        )
      })
    })

    describe('zero', () => {
      it('fails when zero', () => {
        const { error } = getSchema().validate({ housingUnits: 0 })
        expect(error.details[0].message).toBe('Housing units must be 1 or more')
      })
    })

    describe('decimal numbers', () => {
      it('fails when a decimal number (3.5)', () => {
        const { error } = getSchema().validate({
          housingUnits: 3.5
        })
        expect(error.details[0].message).toBe(
          'Housing units must be a whole number'
        )
      })

      it('fails when a decimal string ("3.5")', () => {
        const { error } = getSchema().validate({
          housingUnits: '3.5'
        })
        expect(error.details[0].message).toBe(
          'Housing units must be a whole number'
        )
      })
    })

    describe('extremely large numbers', () => {
      it('fails when a comma-separated value exceeds the maximum ("50,001")', () => {
        const { error } = getSchema().validate({
          housingUnits: '50,001'
        })
        expect(error.details[0].message).toBe(
          'Housing units must be 50,000 or fewer'
        )
      })

      it('fails when exceeding maximum (50001)', () => {
        const { error } = getSchema().validate({
          housingUnits: 50001
        })
        expect(error.details[0].message).toBe(
          'Housing units must be 50,000 or fewer'
        )
      })

      it('fails when extremely large (999999999)', () => {
        const { error } = getSchema().validate({
          housingUnits: 999999999
        })
        expect(error.details[0].message).toBe(
          'Housing units must be 50,000 or fewer'
        )
      })
    })

    describe('non-numeric input', () => {
      it.each([
        ['non-numeric characters', 'abc'],
        ['text with units', '25 units'],
        ['scientific notation', '1e3'],
        ['a plus sign', '+10']
      ])('fails when %s (%s)', (_description, input) => {
        const { error } = getSchema().validate({ housingUnits: input })
        expect(error.details[0].message).toBe('Housing units must be a number')
      })

      it('fails when number with minus sign (-3)', () => {
        const { error } = getSchema().validate({
          housingUnits: '-3'
        })
        expect(error.details[0].message).toBe('Housing units must be 1 or more')
      })
    })
  })
})
