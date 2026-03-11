import { createLogger } from '../../common/helpers/logging/logger.js'
import {
  saveQuoteDataToCache,
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../session-cache.js'
import getViewModel from './get-view-model.js'

const logger = createLogger()

export function handler(request, h) {
  const boundaryGeojson = request.yar.get('boundaryGeojson')

  if (!boundaryGeojson) {
    logger.info('check-boundary-result - no boundary data in session')
    return h.redirect('/quote/upload-boundary')
  }

  const flash = getValidationFlashFromCache(request)
  let validationErrors
  if (flash) {
    validationErrors = flash.validationErrors
    clearValidationFlashFromCache(request)
  }

  const viewModel = getViewModel(boundaryGeojson)

  return h.view('quote/check-boundary-result/index', {
    ...viewModel,
    formSubmitData: flash?.formSubmitData ?? {},
    validationErrors
  })
}

export function postHandler(request, h) {
  const { boundaryCorrect } = request.payload

  if (boundaryCorrect === 'no') {
    request.yar.clear('boundaryGeojson')
    return h.redirect('/quote/upload-boundary')
  }

  const boundaryGeojson = request.yar.get('boundaryGeojson')
  if (!boundaryGeojson) {
    return h.redirect('/quote/upload-boundary')
  }

  saveQuoteDataToCache(request, { boundaryGeojson })
  request.yar.clear('boundaryGeojson')
  logger.info('check-boundary-result - boundary confirmed, saved to quote data')

  return h.redirect('/quote/development-types')
}
