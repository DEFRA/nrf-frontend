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
        yar: { get: vi.fn().mockReturnValue(), set: vi.fn(), clear: vi.fn() },
        logger: { error: vi.fn() }
      }
      const quoteData = { planningType: 'full-planning-permission' }
      saveQuoteDataToCache(request, quoteData)
      expect(request.yar.set).toHaveBeenCalledWith(
        'quote',
        expect.objectContaining({ planningType: 'full-planning-permission' })
      )
    })

    it('merges new data with any existing cache data', () => {
      const request = {
        yar: {
          get: vi
            .fn()
            .mockReturnValue({ planningType: 'full-planning-permission' }),
          set: vi.fn()
        },
        logger: { error: vi.fn() }
      }
      saveQuoteDataToCache(request, { email: 'test@example.com' })
      expect(request.yar.set).toHaveBeenCalledWith(
        'quote',
        expect.objectContaining({
          planningType: 'full-planning-permission',
          email: 'test@example.com'
        })
      )
    })

    it('clears boundaryGeojson when boundaryEntryType changes', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({
            planningType: 'full-planning-permission',
            isHousing: 'yes',
            boundaryEntryType: 'draw',
            boundaryGeojson: { type: 'Polygon' },
            housingUnits: 10,
            email: 'test@example.com'
          }),
          set: vi.fn(),
          clear: vi.fn()
        },
        logger: { error: vi.fn() }
      }
      saveQuoteDataToCache(request, { boundaryEntryType: 'upload' })
      expect(request.yar.set).toHaveBeenCalledWith(
        'quote',
        expect.objectContaining({
          boundaryEntryType: 'upload',
          boundaryGeojson: null
        })
      )
    })

    it('does not clear dependent answers when saving a non-boundary property', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({
            planningType: 'full-planning-permission',
            isHousing: 'yes',
            boundaryEntryType: 'draw',
            boundaryGeojson: { type: 'Polygon' },
            housingUnits: 10,
            email: 'test@example.com'
          }),
          set: vi.fn(),
          clear: vi.fn()
        },
        logger: { error: vi.fn() }
      }
      saveQuoteDataToCache(request, { email: 'new@example.com' })
      expect(request.yar.set).toHaveBeenCalledWith(
        'quote',
        expect.objectContaining({
          email: 'new@example.com',
          housingUnits: 10
        })
      )
      expect(request.yar.clear).not.toHaveBeenCalled()
    })

    it('does not log an error when saving a valid boundaryEntryType', () => {
      const request = {
        yar: {
          get: vi
            .fn()
            .mockReturnValue({ planningType: 'full-planning-permission' }),
          set: vi.fn(),
          clear: vi.fn()
        },
        logger: { error: vi.fn() }
      }
      saveQuoteDataToCache(request, { boundaryEntryType: 'upload' })
      expect(request.logger.error).not.toHaveBeenCalled()
    })

    it('logs an error when the merged data is invalid', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({}),
          set: vi.fn(),
          clear: vi.fn()
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
        yar: {
          get: vi
            .fn()
            .mockReturnValue({ planningType: 'full-planning-permission' })
        }
      }
      const quoteData = getQuoteDataFromCache(request)
      expect(quoteData).toEqual({ planningType: 'full-planning-permission' })
    })

    it('returns null when the cache is empty', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue(null) }
      }
      expect(getQuoteDataFromCache(request)).toBeNull()
    })
  })

  describe('getCompleteQuoteDataFromCache', () => {
    const validQuoteData = {
      planningType: 'full-planning-permission',
      isHousing: 'yes',
      boundaryEntryType: 'draw',
      boundaryGeojson: { type: 'Polygon' },
      housingUnits: 10,
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

    it('logs an error if housingUnits is missing', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({
            planningType: 'full-planning-permission',
            isHousing: 'yes',
            boundaryEntryType: 'draw',
            boundaryGeojson: { type: 'Polygon' },
            email: 'test@example.com'
          })
        },
        logger: { error: vi.fn() }
      }
      getCompleteQuoteDataFromCache(request)
      expect(request.logger.error).toHaveBeenCalledWith(
        expect.any(Error),
        'getQuoteDataFromCache: invalid quote data'
      )
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
