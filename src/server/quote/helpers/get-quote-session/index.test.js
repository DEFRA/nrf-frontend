import {
  clearQuoteDataFromCache,
  getQuoteDataFromCache,
  saveQuoteDataToCache
} from './index.js'

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

  describe('Clear quote data from session cache', () => {
    it('clears the cache', () => {
      const request = { yar: { clear: vi.fn() } }
      clearQuoteDataFromCache(request)
      expect(request.yar.clear).toHaveBeenCalledWith('quote')
    })
  })
})
