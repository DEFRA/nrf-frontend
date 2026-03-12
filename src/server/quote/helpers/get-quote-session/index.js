const cacheKey = 'quote'

export const saveQuoteDataToCache = (request, quoteData) => {
  const existingQuoteCache = getQuoteDataFromCache(request)
  request.yar.set(cacheKey, { ...existingQuoteCache, ...quoteData })
  return getQuoteDataFromCache(request)
}

export const getQuoteDataFromCache = (request) =>
  request.yar.get(cacheKey) || {}

export const clearQuoteDataFromCache = (request) => request.yar.clear(cacheKey)
