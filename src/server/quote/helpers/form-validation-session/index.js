const flashKey = 'quoteFlash'

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
