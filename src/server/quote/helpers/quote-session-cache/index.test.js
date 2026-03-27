import {
  clearQuoteDataFromCache,
  getCompleteQuoteDataFromCache,
  getQuoteDataFromCache,
  saveQuoteDataToCache
} from './index.js'

describe('Save and retrieve quote data from session cache', () => {
  describe('Save quote data to session cache', () => {
    it('saves new data if the existing cache is empty', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue(), set: vi.fn() },
        logger: { error: vi.fn() }
      }
      const quoteData = { boundaryEntryType: 'draw' }
      saveQuoteDataToCache(request, quoteData)
      expect(request.yar.set).toHaveBeenCalledWith(
        'quote',
        expect.objectContaining({ boundaryEntryType: 'draw' })
      )
    })

    it('merges new data with any existing cache data', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({ boundaryEntryType: 'draw' }),
          set: vi.fn()
        },
        logger: { error: vi.fn() }
      }
      saveQuoteDataToCache(request, { email: 'test@example.com' })
      expect(request.yar.set).toHaveBeenCalledWith(
        'quote',
        expect.objectContaining({
          boundaryEntryType: 'draw',
          email: 'test@example.com'
        })
      )
    })

    it('strips fields made redundant by updated answers', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({
            boundaryEntryType: 'draw',
            boundaryGeojson: { type: 'Polygon' },
            developmentTypes: ['housing'],
            residentialBuildingCount: 10,
            email: 'test@example.com'
          }),
          set: vi.fn()
        },
        logger: { error: vi.fn() }
      }
      // changing to other-residential means residentialBuildingCount is no longer needed
      saveQuoteDataToCache(request, { developmentTypes: ['other-residential'] })
      expect(request.yar.set).toHaveBeenCalledWith(
        'quote',
        expect.not.objectContaining({ residentialBuildingCount: 10 })
      )
    })

    it('logs an error when the merged data is invalid', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({}),
          set: vi.fn()
        },
        logger: { error: vi.fn() }
      }
      saveQuoteDataToCache(request, { boundaryEntryType: 'invalid-value' })
      expect(request.logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'getQuoteDataFromCache: invalid quote data'
      )
    })
  })

  describe('Retrieve quote data from session cache', () => {
    it('returns the existing cache data', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue({ boundaryEntryType: 'draw' }) }
      }
      const quoteData = getQuoteDataFromCache(request)
      expect(quoteData).toEqual({ boundaryEntryType: 'draw' })
    })

    it('returns an empty object when the cache is empty', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue(null) }
      }
      expect(getQuoteDataFromCache(request)).toEqual({})
    })
  })

  describe('getCompleteQuoteDataFromCache', () => {
    const validQuoteData = {
      boundaryEntryType: 'draw',
      boundaryGeojson: { type: 'Polygon' },
      developmentTypes: ['housing'],
      residentialBuildingCount: 10,
      email: 'test@example.com'
    }

    it('returns validated quote data when cache contains valid data', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue(validQuoteData) },
        logger: { error: vi.fn() }
      }
      const result = getCompleteQuoteDataFromCache(request)
      expect(result).toMatchObject(validQuoteData)
      expect(request.logger.error).not.toHaveBeenCalled()
    })

    it('strips fields not required by the schema', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({
            ...validQuoteData,
            peopleCount: 5
          })
        },
        logger: { error: vi.fn() }
      }
      const result = getCompleteQuoteDataFromCache(request)
      expect(result.peopleCount).toBeUndefined()
    })

    it('returns both residentialBuildingCount and peopleCount when both development types are present', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({
            boundaryEntryType: 'draw',
            boundaryGeojson: { type: 'Polygon' },
            developmentTypes: ['housing', 'other-residential'],
            residentialBuildingCount: 10,
            peopleCount: 5,
            email: 'test@example.com'
          })
        },
        logger: { error: vi.fn() }
      }
      const result = getCompleteQuoteDataFromCache(request)
      expect(result.residentialBuildingCount).toBe(10)
      expect(result.peopleCount).toBe(5)
      expect(request.logger.error).not.toHaveBeenCalled()
    })

    it('logs an error when cache data is invalid', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue({ boundaryEntryType: 'draw' }) },
        logger: { error: vi.fn() }
      }
      getCompleteQuoteDataFromCache(request)
      expect(request.logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'getQuoteDataFromCache: invalid quote data'
      )
    })

    it('logs an error when cache is empty', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue(null) },
        logger: { error: vi.fn() }
      }
      getCompleteQuoteDataFromCache(request)
      expect(request.logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'getQuoteDataFromCache: invalid quote data'
      )
    })
  })

  describe('Clear quote data from session cache', () => {
    it('clears the cache', () => {
      const request = { yar: { clear: vi.fn() } }
      clearQuoteDataFromCache(request)
      expect(request.yar.clear).toHaveBeenCalledWith('quote')
    })
  })
})
