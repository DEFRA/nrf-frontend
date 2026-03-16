import { completeQuoteDataSchema } from '../quote-schema/index.js'

const cacheKey = 'quote'

const logInvalidQuoteData = (request) => {
  request.logger.error(
    new Error('Invalid quote data'),
    `getQuoteDataFromCache: invalid quote data`
  )
}

export const saveQuoteDataToCache = (request, quoteData) => {
  const existingQuoteCache = getQuoteDataFromCache(request)
  const updatedQuoteCache = { ...existingQuoteCache, ...quoteData }
  // this will validate and also remove any values no longer required
  const { error, value } = completeQuoteDataSchema.validate(updatedQuoteCache)
  if (error) {
    logInvalidQuoteData(request)
  }
  request.yar.set(cacheKey, value)
  return getQuoteDataFromCache(request)
}

export const getQuoteDataFromCache = (request) =>
  request.yar.get(cacheKey) || {}

export const getCompleteQuoteDataFromCache = (request) => {
  const quoteData = request.yar.get(cacheKey)
  const { error, value } = completeQuoteDataSchema.validate(quoteData)
  if (error) {
    logInvalidQuoteData(request)
  }
  return value
}

export const clearQuoteDataFromCache = (request) => request.yar.clear(cacheKey)
