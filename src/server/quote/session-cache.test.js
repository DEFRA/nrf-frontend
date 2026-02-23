import {
  getQuoteDataFromCache,
  saveQuoteDataToCache,
  saveValidationFlashToCache,
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from './session-cache.js'

describe('Save and retrieve quote data from session cache', () => {
  describe('Save quote data to session cache', () => {
    it('saves new data if the existing cache is empty', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue(), set: vi.fn() }
      }
      const quoteData = { field2: 'value2' }
      saveQuoteDataToCache(request, quoteData)
      expect(request.yar.set).toHaveBeenCalledWith('quote', quoteData)
    })

    it('merges new data with any existing cache data', () => {
      const request = {
        yar: {
          get: vi.fn().mockReturnValue({ field1: 'value1' }),
          set: vi.fn()
        }
      }
      const quoteData = { field2: 'value2' }
      saveQuoteDataToCache(request, quoteData)
      expect(request.yar.set).toHaveBeenCalledWith('quote', {
        field1: 'value1',
        field2: 'value2'
      })
    })
  })

  describe('Retrieve quote data from session cache', () => {
    it('returns the existing cache data', () => {
      const request = {
        yar: { get: vi.fn().mockReturnValue({ field1: 'value1' }) }
      }
      const quoteData = getQuoteDataFromCache(request)
      expect(quoteData).toEqual({ field1: 'value1' })
    })
  })
})

describe('Validation flash cache', () => {
  describe('saveValidationFlashToCache', () => {
    it('saves validation errors and form submit data under the flash key', () => {
      const request = { yar: { set: vi.fn() } }
      const validationErrors = {
        summary: [{ href: '#field1', text: 'Required' }]
      }
      const formSubmitData = { field1: 'bad' }
      saveValidationFlashToCache(request, { validationErrors, formSubmitData })
      expect(request.yar.set).toHaveBeenCalledWith('quoteFlash', {
        validationErrors,
        formSubmitData
      })
    })
  })

  describe('getValidationFlashFromCache', () => {
    it('returns the flash data when it exists', () => {
      const flashData = {
        validationErrors: { summary: [] },
        formSubmitData: { field1: 'bad' }
      }
      const request = { yar: { get: vi.fn().mockReturnValue(flashData) } }
      expect(getValidationFlashFromCache(request)).toEqual(flashData)
      expect(request.yar.get).toHaveBeenCalledWith('quoteFlash')
    })

    it('returns null when no flash data exists', () => {
      const request = { yar: { get: vi.fn().mockReturnValue(null) } }
      expect(getValidationFlashFromCache(request)).toBeNull()
    })
  })

  describe('clearValidationFlashFromCache', () => {
    it('clears the flash key from the session', () => {
      const request = { yar: { clear: vi.fn() } }
      clearValidationFlashFromCache(request)
      expect(request.yar.clear).toHaveBeenCalledWith('quoteFlash')
    })
  })
})
