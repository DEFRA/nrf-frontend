import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('residential form validation', () => {
  describe('residentialBuildingCount', () => {
    describe('valid inputs', () => {
      it('passes for a valid integer (6)', () => {
        const { error } = getSchema().validate({ residentialBuildingCount: 6 })
        expect(error).toBeUndefined()
      })

      it('passes for a string number that gets converted (12)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '12'
        })
        expect(error).toBeUndefined()
      })

      it('passes for a string with spaces that gets trimmed ("12 ")', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: ' 12 '
        })
        expect(error).toBeUndefined()
      })

      it('passes for maximum allowed value (999999)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 999999
        })
        expect(error).toBeUndefined()
      })
    })

    describe('empty or missing input', () => {
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
    })

    describe('zero', () => {
      it('fails when zero', () => {
        const { error } = getSchema().validate({ residentialBuildingCount: 0 })
        expect(error.details[0].message).toBe(
          'Enter a whole number greater than zero'
        )
      })
    })

    describe('decimal numbers', () => {
      it('fails when a decimal number (3.5)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 3.5
        })
        expect(error.details[0].message).toBe(
          'Enter a whole number greater than zero'
        )
      })
    })

    describe('extremely large numbers', () => {
      it('fails when exceeding maximum (1000000)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 1000000
        })
        expect(error.details[0].message).toBe(
          'Enter a smaller whole number within the allowed range'
        )
      })

      it('fails when extremely large (999999999)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 999999999
        })
        expect(error.details[0].message).toBe(
          'Enter a smaller whole number within the allowed range'
        )
      })
    })

    describe('non-numeric input', () => {
      it('fails when non-numeric characters (abc)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 'abc'
        })
        expect(error.details[0].message).toBe(
          'Enter the number of residential units'
        )
      })

      it('fails when text with units (25 units)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '25 units'
        })
        expect(error.details[0].message).toBe(
          'Enter the number of residential units'
        )
      })

      it('fails when number with comma separator (1,000)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '1,000'
        })
        expect(error.details[0].message).toBe(
          'Enter the number of residential units'
        )
      })

      it('fails when scientific notation (1e3)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '1e3'
        })
        expect(error.details[0].message).toBe(
          'Enter the number of residential units'
        )
      })

      it('fails when number with plus sign (+10)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '+10'
        })
        expect(error.details[0].message).toBe(
          'Enter the number of residential units'
        )
      })

      it('fails when number with minus sign (-3)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '-3'
        })
        expect(error.details[0].message).toBe(
          'Enter the number of residential units'
        )
      })
    })
  })
})
