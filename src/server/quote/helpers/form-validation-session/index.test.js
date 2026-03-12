import {
  saveValidationFlashToCache,
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from './index.js'

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
