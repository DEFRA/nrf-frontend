const cacheKey = 'quote'

export const saveQuoteDataToCache = (request, quoteData) => {
  const existingQuoteCache = getQuoteDataFromCache(request)
  request.yar.set(cacheKey, { ...existingQuoteCache, ...quoteData })
}

export const getQuoteDataFromCache = (request) =>
  request.yar.get(cacheKey) || {}
