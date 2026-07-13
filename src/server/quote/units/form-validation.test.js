import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('units form validation', () => {
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

      it('passes for a string with leading/trailing spaces that gets trimmed ("12 ")', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: ' 12 '
        })
        expect(error).toBeUndefined()
      })

      it('passes for a string with spaces between digits ("3 4  5")', () => {
        const { error, value } = getSchema().validate({
          residentialBuildingCount: '3 4  5'
        })
        expect(error).toBeUndefined()
        expect(value.residentialBuildingCount).toBe(345)
      })

      it('passes for minimum allowed value (1)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 1
        })
        expect(error).toBeUndefined()
      })

      it('passes for maximum allowed value (50000)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 50000
        })
        expect(error).toBeUndefined()
      })
    })

    describe('empty or missing input', () => {
      it('fails when absent', () => {
        const { error } = getSchema().validate({})
        expect(error.details[0].message).toBe(
          'Enter the number of housing units'
        )
      })

      it('fails when empty string', () => {
        const { error } = getSchema().validate({ residentialBuildingCount: '' })
        expect(error.details[0].message).toBe(
          'Enter the number of housing units'
        )
      })
    })

    describe('zero', () => {
      it('fails when zero', () => {
        const { error } = getSchema().validate({ residentialBuildingCount: 0 })
        expect(error.details[0].message).toBe('Housing units must be 1 or more')
      })
    })

    describe('decimal numbers', () => {
      it('fails when a decimal number (3.5)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 3.5
        })
        expect(error.details[0].message).toBe(
          'Housing units must be a whole number'
        )
      })

      it('fails when a decimal string ("3.5")', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '3.5'
        })
        expect(error.details[0].message).toBe(
          'Housing units must be a whole number'
        )
      })
    })

    describe('extremely large numbers', () => {
      it('fails when exceeding maximum (50001)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 50001
        })
        expect(error.details[0].message).toBe(
          'Housing units must be 50,000 or fewer'
        )
      })

      it('fails when extremely large (999999999)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 999999999
        })
        expect(error.details[0].message).toBe(
          'Housing units must be 50,000 or fewer'
        )
      })
    })

    describe('non-numeric input', () => {
      it('fails when non-numeric characters (abc)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: 'abc'
        })
        expect(error.details[0].message).toBe('Housing units must be a number')
      })

      it('fails when text with units (25 units)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '25 units'
        })
        expect(error.details[0].message).toBe('Housing units must be a number')
      })

      it('fails when number with comma separator (1,000)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '1,000'
        })
        expect(error.details[0].message).toBe('Housing units must be a number')
      })

      it('fails when scientific notation (1e3)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '1e3'
        })
        expect(error.details[0].message).toBe('Housing units must be a number')
      })

      it('fails when number with plus sign (+10)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '+10'
        })
        expect(error.details[0].message).toBe('Housing units must be a number')
      })

      it('fails when number with minus sign (-3)', () => {
        const { error } = getSchema().validate({
          residentialBuildingCount: '-3'
        })
        expect(error.details[0].message).toBe('Housing units must be 1 or more')
      })
    })
  })
})
