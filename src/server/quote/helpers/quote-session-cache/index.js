import {
  inProgressQuoteDataSchema,
  completeQuoteDataSchema
} from '../quote-schema/index.js'

const cacheKey = 'quote'

const logInvalidQuoteData = (request) => {
  request.logger.error(
    new Error('Invalid quote data'),
    `getQuoteDataFromCache: invalid quote data`
  )
}

export const saveQuoteDataToCache = (request, quoteData) => {
  const existingQuoteCache = getQuoteDataFromCache(request) ?? {}

  const boundaryEntryTypeChanged =
    'boundaryEntryType' in quoteData &&
    quoteData.boundaryEntryType !== existingQuoteCache.boundaryEntryType

  // When the boundary entry type changes, clear the boundary geojson
  if (boundaryEntryTypeChanged) {
    quoteData = {
      ...quoteData,
      boundaryGeojson: null
    }
  }

  const updatedQuoteCache = { ...existingQuoteCache, ...quoteData }
  // this will validate and also remove any values no longer required
  const { error, value } = inProgressQuoteDataSchema.validate(updatedQuoteCache)
  if (error) {
    logInvalidQuoteData(request)
  }
  request.yar.set(cacheKey, value)
  return getQuoteDataFromCache(request)
}

export const getQuoteDataFromCache = (request) => request.yar.get(cacheKey)

export const getCompleteQuoteDataFromCache = (request) => {
  const quoteData = request.yar.get(cacheKey)
  const { error, value } = completeQuoteDataSchema.validate(quoteData)
  if (error) {
    logInvalidQuoteData(request)
  }
  return value
}

/**
 * Whether the cached quote data satisfies the complete schema (every required
 * question answered). Unlike getCompleteQuoteDataFromCache this is routine
 * flow control — a user deep-linking before finishing the journey is expected
 * — so it doesn't log.
 * @param {import('@hapi/hapi').Request} request
 * @returns {boolean}
 */
export const isQuoteDataComplete = (request) => {
  const quoteData = request.yar.get(cacheKey)
  const { error } = completeQuoteDataSchema.validate(quoteData)
  return error === undefined
}

export const initQuoteSession = (request) => request.yar.set(cacheKey, {})

export const clearQuoteDataFromCache = (request) => request.yar.clear(cacheKey)
