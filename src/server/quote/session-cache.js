const cacheKey = 'quote'
const flashKey = 'quoteFlash'

export const saveQuoteDataToCache = (request, quoteData) => {
  const existingQuoteCache = getQuoteDataFromCache(request)
  request.yar.set(cacheKey, { ...existingQuoteCache, ...quoteData })
}

export const getQuoteDataFromCache = (request) =>
  request.yar.get(cacheKey) || {}

export const saveValidationFlashToCache = (
  request,
  { validationErrors, formSubmitData }
) => {
  request.yar.set(flashKey, { validationErrors, formSubmitData })
}

export const getValidationFlashFromCache = (request) =>
  request.yar.get(flashKey)

export const clearValidationFlashFromCache = (request) =>
  request.yar.clear(flashKey)
