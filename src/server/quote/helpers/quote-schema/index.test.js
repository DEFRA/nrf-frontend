import { completeQuoteDataSchema, inProgressQuoteDataSchema } from './index.js'

const validBase = {
  planningType: 'full-planning-permission',
  isHousing: 'yes',
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
  housingUnits: '10',
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

  describe('isHousing', () => {
    it('fails when isHousing is missing', () => {
      const { isHousing: _, ...withoutIsHousing } = validBase
      const { error } = completeQuoteDataSchema.validate(withoutIsHousing)
      expect(error).toBeDefined()
    })
  })

  describe('housingUnits', () => {
    it('passes with housingUnits present', () => {
      const { error } = completeQuoteDataSchema.validate(validBase)
      expect(error).toBeUndefined()
    })

    it('fails when housingUnits is missing', () => {
      const { housingUnits: _, ...without } = validBase
      const { error } = completeQuoteDataSchema.validate(without)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('Enter the number of housing units')
    })
  })

  describe('boundaryFilename', () => {
    it('is optional for drawn boundaries', () => {
      const { error } = completeQuoteDataSchema.validate(validBase)
      expect(error).toBeUndefined()
    })

    it('accepts a .shp filename for uploaded boundaries', () => {
      const { error, value } = completeQuoteDataSchema.validate({
        ...validBase,
        boundaryEntryType: 'upload',
        boundaryFilename: 'site-boundary.shp'
      })
      expect(error).toBeUndefined()
      expect(value.boundaryFilename).toBe('site-boundary.shp')
    })

    it('accepts null', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        boundaryFilename: null
      })
      expect(error).toBeUndefined()
    })

    it('rejects a filename longer than 255 characters', () => {
      const { error } = completeQuoteDataSchema.validate({
        ...validBase,
        boundaryFilename: `${'a'.repeat(252)}.shp`
      })
      expect(error).toBeDefined()
    })
  })
})

describe('inProgressQuoteDataSchema', () => {
  it('passes with a fully valid object', () => {
    const { error } = inProgressQuoteDataSchema.validate(validBase)
    expect(error).toBeUndefined()
  })

  it('allows null isHousing', () => {
    const { error } = inProgressQuoteDataSchema.validate({
      ...validBase,
      isHousing: null
    })
    expect(error).toBeUndefined()
  })

  it('allows null housingUnits', () => {
    const { error } = inProgressQuoteDataSchema.validate({
      ...validBase,
      housingUnits: null
    })
    expect(error).toBeUndefined()
  })

  it('allows missing housingUnits', () => {
    const { housingUnits: _, ...without } = validBase
    const { error } = inProgressQuoteDataSchema.validate(without)
    expect(error).toBeUndefined()
  })
})
