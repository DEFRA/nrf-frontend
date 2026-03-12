import { completeQuoteDataSchema } from '../quote-schema/index.js'

const cacheKey = 'quote'

export const saveQuoteDataToCache = (request, quoteData) => {
  const existingQuoteCache = getQuoteDataFromCache(request)
  request.yar.set(cacheKey, { ...existingQuoteCache, ...quoteData })
  return getQuoteDataFromCache(request)
}

export const getQuoteDataFromCache = (request) =>
  request.yar.get(cacheKey) || {}

export const getCompleteQuoteDataFromCache = (request) => {
  const quoteData = request.yar.get(cacheKey)
  const { error, value } = completeQuoteDataSchema.validate(quoteData)
  if (error) {
    request.logger.error(
      error,
      'getCompleteQuoteDataFromCache: invalid quote data'
    )
  }
  return value
}

export const clearQuoteDataFromCache = (request) => request.yar.clear(cacheKey)
