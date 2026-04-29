import Boom from '@hapi/boom'
import joi from 'joi'
import { mapValidationErrorsForDisplay } from '../common/helpers/form-validation.js'
import {
  setCookiePreferences,
  getCookiePreferences
} from './helpers/cookie-service.js'
import { COOKIE_ROUTE, CONFIRMATION_QUERY_PARAM } from './helpers/constants.js'
import {
  clearValidationFlashFromCache,
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../quote/helpers/form-validation-session/index.js'
import { statusCodes } from '../common/constants/status-codes.js'

const COOKIES_VIEW_ROUTE = 'cookies/index'

const cookiesPageSettings = {
  pageTitle: 'Cookies on Nature Restoration Fund'
}

const isSafeRelativePath = (value) =>
  typeof value === 'string' && /^\/(?!\/)/.test(value)

export const cookiesController = {
  options: {
    auth: false
  },
  handler(request, h) {
    const preferences = getCookiePreferences(request)
    const showSuccessBanner = request.query.success === 'true'
    let analyticsChoice
    if ([true, false].includes(preferences.analytics)) {
      analyticsChoice = preferences.analytics === true ? 'yes' : 'no'
    }
    const formValidationErrors = getValidationFlashFromCache(request)
    const redirectUrl = isSafeRelativePath(request.query.redirectUrl)
      ? request.query.redirectUrl
      : ''
    const backUrl = redirectUrl || '/'

    return h.view(COOKIES_VIEW_ROUTE, {
      ...cookiesPageSettings,
      payload: {
        analytics: analyticsChoice
      },
      showSuccessBanner,
      backUrl,
      redirectUrl,
      validationErrors: formValidationErrors?.validationErrors
    })
  }
}
const validationMessage = 'Select if you want to accept analytics cookies'

export const cookiesSubmitController = {
  options: {
    auth: false,
    validate: {
      payload: joi.object({
        csrfToken: joi.string().allow(''),
        analytics: joi.string().valid('yes', 'no').required().messages({
          'any.only': validationMessage,
          'string.empty': validationMessage,
          'any.required': validationMessage
        }),
        source: joi.string().valid('page', 'banner').optional(),
        redirectUrl: joi.string().allow('').optional()
      }),
      failAction: (request, h, err) => {
        const { payload } = request
        const validationErrors = mapValidationErrorsForDisplay(err.details)
        saveValidationFlashToCache(request, {
          validationErrors,
          formSubmitData: payload
        })
        const redirectPath = isSafeRelativePath(payload?.redirectUrl)
          ? `${request.path}?redirectUrl=${encodeURIComponent(payload.redirectUrl)}`
          : request.path
        return h
          .redirect(redirectPath)
          .code(statusCodes.redirectAfterPost)
          .takeover()
      }
    }
  },
  handler(request, h) {
    const { payload } = request
    const analytics = payload.analytics === 'yes'
    const isFromBanner = payload.source === 'banner'

    try {
      const safeRedirect = isSafeRelativePath(payload.redirectUrl)
        ? payload.redirectUrl
        : '/'
      const successRedirect = isSafeRelativePath(payload.redirectUrl)
        ? `${COOKIE_ROUTE}?success=true&redirectUrl=${encodeURIComponent(payload.redirectUrl)}`
        : `${COOKIE_ROUTE}?success=true`
      const bannerRedirect = `${safeRedirect}${safeRedirect.includes('?') ? '&' : '?'}${CONFIRMATION_QUERY_PARAM}=1`
      const redirectUrl = isFromBanner ? bannerRedirect : successRedirect

      const response = h.redirect(redirectUrl)

      setCookiePreferences(response, analytics)
      clearValidationFlashFromCache(request)

      return response
    } catch (error) {
      const msg = 'Error saving cookie preferences'
      request.logger.error(error, msg)
      throw Boom.internal(msg)
    }
  }
}
