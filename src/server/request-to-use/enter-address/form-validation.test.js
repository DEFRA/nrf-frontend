import { describe, it, expect } from 'vitest'
import getSchema from './form-validation.js'

const postcode = 'DV1 6RP'
const postcodeNoSpace = 'DV16RP'

const validRequiredData = {
  formVariant: 'individual',
  addressLine1: '1 Development Road',
  townOrCity: 'Development',
  postcode
}

describe('enter address form validation', () => {
  describe('formVariant', () => {
    it.each(['individual', 'employee', 'agent'])(
      'passes for %s',
      (formVariant) => {
        const { error } = getSchema().validate({
          ...validRequiredData,
          formVariant,
          ...(formVariant === 'agent' && { fullName: 'Trevor Barker' })
        })
        expect(error).toBeUndefined()
      }
    )

    it('fails when absent', () => {
      const { formVariant, ...withoutVariant } = validRequiredData
      const { error } = getSchema().validate(withoutVariant)
      expect(error.details[0].message).toBe(
        'Enter the details for the request to use'
      )
    })

    it('fails for an unrecognised value', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        formVariant: 'someone-else'
      })
      expect(error.details[0].message).toBe(
        'Enter the details for the request to use'
      )
    })
  })

  describe('fullName', () => {
    it('passes when the variant is agent and a name is given', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        formVariant: 'agent',
        fullName: 'Trevor Barker'
      })
      expect(error).toBeUndefined()
    })

    it('fails with the full name error when the variant is agent and it is empty', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        formVariant: 'agent',
        fullName: ''
      })
      expect(error.details[0].message).toBe('Enter the full name')
    })

    it('fails with the full name error when the variant is agent and it is only spaces', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        formVariant: 'agent',
        fullName: '   '
      })
      expect(error.details[0].message).toBe('Enter the full name')
    })

    it('passes when the variant is not agent and no name is submitted', () => {
      const { error } = getSchema().validate(validRequiredData)
      expect(error).toBeUndefined()
    })

    it('passes when the variant is not agent and the name is empty', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        fullName: ''
      })
      expect(error).toBeUndefined()
    })
  })

  describe('addressLine1', () => {
    it('fails when empty', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        addressLine1: ''
      })
      expect(error.details[0].message).toBe(
        'Enter address line 1, typically the building and street'
      )
    })

    it('fails when longer than 255 characters', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        addressLine1: 'a'.repeat(256)
      })
      expect(error.details[0].message).toBe(
        'Address line 1 must be 255 characters or fewer'
      )
    })
  })

  describe('townOrCity', () => {
    it('fails when empty', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        townOrCity: ''
      })
      expect(error.details[0].message).toBe('Enter town or city')
    })
  })

  describe('postcode', () => {
    it.each([
      ['lower case', 'dv1 6rp', postcode],
      ['upper case', postcode, postcode],
      ['no spaces', postcodeNoSpace, postcode],
      ['extra spaces at both ends', `  ${postcode}  `, postcode],
      ['extra spaces in the middle', 'DV1   6RP', postcode],
      ['hyphens', 'DV1-6RP', postcode],
      ['brackets', '(DV1) 6RP', postcode],
      ['full stops', 'DV1.6RP', postcode]
    ])('accepts a postcode with %s', (_, postcode, normalised) => {
      const { error, value } = getSchema().validate({
        ...validRequiredData,
        postcode
      })
      expect(error).toBeUndefined()
      expect(value.postcode).toBe(normalised)
    })

    it('fails when empty', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        postcode: ''
      })
      expect(error.details[0].message).toBe('Enter postcode')
    })

    it('fails when only punctuation is left after normalising', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        postcode: '-.-'
      })
      expect(error.details[0].message).toBe('Enter postcode')
    })

    it('fails when the postcode is longer than 10 characters after normalising', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        postcode: 'SW1A 1AA EXTRA'
      })
      expect(error.details[0].message).toBe(
        'Postcode must be 10 characters or fewer'
      )
    })
  })

  describe('optional fields', () => {
    it('passes when address line 2 and county are absent', () => {
      const { error } = getSchema().validate(validRequiredData)
      expect(error).toBeUndefined()
    })

    it('passes when address line 2 and county are empty strings', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        addressLine2: '',
        county: ''
      })
      expect(error).toBeUndefined()
    })

    it('passes when address line 2 and county have values', () => {
      const { error } = getSchema().validate({
        ...validRequiredData,
        addressLine2: 'Building 2',
        county: 'Devonshire'
      })
      expect(error).toBeUndefined()
    })
  })
})
