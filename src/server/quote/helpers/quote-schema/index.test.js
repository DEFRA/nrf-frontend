import { completeQuoteDataSchema } from './index.js'

const validBase = {
  boundaryEntryType: 'draw',
  boundaryGeojson: {
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:EPSG::27700'
      }
    },
    type: 'Polygon',
    coordinates: [
      [
        [530000, 180000],
        [530100, 180000],
        [530100, 180100],
        [530000, 180100],
        [530000, 180000]
      ]
    ]
  },
  developmentTypes: ['housing'],
  residentialBuildingCount: '10',
  wasteWaterTreatmentWorksId: '101',
  wasteWaterTreatmentWorksName: 'Great Billing WRC',
  email: 'test@example.com'
}

describe('completeQuoteDataSchema', () => {
  describe('boundaryGeojson', () => {
    it('passes with a valid object', () => {
      const { error } = completeQuoteDataSchema.validate(validBase)
      expect(error).toBeUndefined()
    })

    it('fails when boundaryGeojson is missing', () => {
      const { boundaryGeojson: _, ...withoutGeojson } = validBase
      const { error } = completeQuoteDataSchema.validate(withoutGeojson)
      expect(error).toBeDefined()
    })
  })

  describe('when developmentTypes is ["housing"]', () => {
    it('passes with residentialBuildingCount present', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['housing'],
        residentialBuildingCount: '10'
      })
      expect(error).toBeUndefined()
    })

    it('fails when residentialBuildingCount is missing', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['housing'],
        residentialBuildingCount: undefined
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Enter the number of residential units'
      )
    })

    it('strips peopleCount if present', () => {
      const { value } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['housing'],
        residentialBuildingCount: '10',
        peopleCount: 5
      })
      expect(value.peopleCount).toBeUndefined()
    })
  })

  describe('when developmentTypes is ["other-residential"]', () => {
    it('passes with peopleCount present', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['other-residential'],
        peopleCount: 5
      })
      expect(error).toBeUndefined()
    })

    it('fails when peopleCount is missing', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['other-residential']
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Enter the maximum number of people to continue'
      )
    })

    it('strips residentialBuildingCount if present', () => {
      const { value } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['other-residential'],
        peopleCount: 5,
        residentialBuildingCount: '10'
      })
      expect(value.residentialBuildingCount).toBeUndefined()
    })
  })

  describe('when developmentTypes is ["housing", "other-residential"]', () => {
    it('passes with both residentialBuildingCount and peopleCount present', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['housing', 'other-residential'],
        residentialBuildingCount: '10',
        peopleCount: 5
      })
      expect(error).toBeUndefined()
    })

    it('fails when residentialBuildingCount is missing', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['housing', 'other-residential'],
        peopleCount: 5,
        residentialBuildingCount: undefined
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Enter the number of residential units'
      )
    })

    it('fails when peopleCount is missing', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['housing', 'other-residential'],
        residentialBuildingCount: '10'
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Enter the maximum number of people to continue'
      )
    })

    it('fails when both residentialBuildingCount and peopleCount are missing', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        developmentTypes: ['housing', 'other-residential']
      })
      expect(error).toBeDefined()
    })
  })
})
