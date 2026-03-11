import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

describe('people-count form validation', () => {
  it('passes for a valid integer', () => {
    const { error } = getSchema().validate({ peopleCount: 100 })
    expect(error).toBeUndefined()
  })

  it('passes for a value of 1', () => {
    const { error } = getSchema().validate({ peopleCount: 1 })
    expect(error).toBeUndefined()
  })

  it('converts string to number, including trimming spaces', () => {
    const { error, value } = getSchema().validate({ peopleCount: ' 1 ' })
    expect(error).toBeUndefined()
    expect(value.peopleCount).toBe(1)
  })

  it('fails when absent', () => {
    const { error } = getSchema().validate({})
    expect(error.details[0].message).toBe(
      'Enter the maximum number of people to continue'
    )
  })

  it('fails when the value is not a number', () => {
    const { error } = getSchema().validate({ peopleCount: 'not-a-number' })
    expect(error.details[0].message).toBe(
      'Enter the maximum number of people to continue'
    )
  })

  it('fails for a negative number', () => {
    const { error } = getSchema().validate({ peopleCount: -23 })
    expect(error.details[0].message).toBe(
      'Enter a whole number greater than zero'
    )
  })

  it('fails for a negative number as a string', () => {
    const { error } = getSchema().validate({ peopleCount: '-23' })
    expect(error.details[0].message).toBe(
      'Enter a whole number greater than zero'
    )
  })

  it('fails when the value is an empty string', () => {
    const { error } = getSchema().validate({ peopleCount: '' })
    expect(error.details[0].message).toBe(
      'Enter the maximum number of people to continue'
    )
  })

  it('fails when the value is a fractional number', () => {
    const { error } = getSchema().validate({ peopleCount: 1.5 })
    expect(error.details[0].message).toBe(
      'Enter a whole number greater than zero'
    )
  })

  it('fails when the value is zero', () => {
    const { error } = getSchema().validate({ peopleCount: 0 })
    expect(error.details[0].message).toBe(
      'Enter a whole number greater than zero'
    )
  })
})
