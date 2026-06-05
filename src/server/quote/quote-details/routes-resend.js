import joi from 'joi'
import { quoteDetailsResendKnownController } from './controller-resend-known.js'
import { quoteDetailsResendUnknownController } from './controller-resend-unknown.js'
import { resendConfirmationController } from './controller-resend-confirmation.js'
import { referencePattern, tokenPattern } from './routes.js'
import { mapValidationErrorsForDisplay } from '../../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from '../helpers/form-validation-session/index.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { emailField } from '../../common/validation/email.js'
import getErrorViewModel from './get-error-view-model.js'
import { quoteAccessStatus } from './helpers/quote-access-status.js'

export const resendKnownPath = '/quote/{reference}/resend-known'
export const resendUnknownPath = '/quote/{reference}/resend-unknown'

const referenceSchema = joi
  .string()
  .pattern(new RegExp(`^${referencePattern.source}$`))
  .required()

const tokenSchema = joi
  .string()
  .pattern(new RegExp(`^${tokenPattern.source}$`))
  .required()

// On an invalid email, save the error to the session flash and redirect back to
// the State 3 "link has expired" page that hosts the form (PRG). The original
// token is carried as a hidden form field so we can rebuild that page's URL.
const invalidEmailFailAction = (request, h, err) => {
  const validationErrors = mapValidationErrorsForDisplay(err.details)
  saveValidationFlashToCache(request, {
    validationErrors,
    formSubmitData: { email: request.payload?.email }
  })
  const { reference } = request.params
  const { token } = request.payload ?? {}
  return h
    .redirect(`/quote/${reference}/${token}`)
    .code(statusCodes.redirectAfterPost)
    .takeover()
}

// A corrupted token on the one-click resend can't be used, so fall back to the
// generic expired-link error page (which offers the email-based resend) rather
// than leaking a raw Hapi 400.
const invalidKnownResendFailAction = (request, h) => {
  const { reference } = request.params
  return h
    .view(
      'quote/quote-details/error',
      getErrorViewModel(quoteAccessStatus.invalid, { reference })
    )
    .takeover()
}

export default [
  {
    method: 'POST',
    path: resendKnownPath,
    options: {
      validate: {
        params: joi.object({ reference: referenceSchema }),
        payload: joi.object({ token: tokenSchema }),
        failAction: invalidKnownResendFailAction
      }
    },
    ...quoteDetailsResendKnownController
  },
  {
    method: 'GET',
    path: resendKnownPath,
    ...resendConfirmationController({ heading: 'New link sent' })
  },
  {
    method: 'POST',
    path: resendUnknownPath,
    options: {
      validate: {
        params: joi.object({ reference: referenceSchema }),
        payload: joi.object({
          token: tokenSchema,
          email: emailField()
        }),
        failAction: invalidEmailFailAction
      }
    },
    ...quoteDetailsResendUnknownController
  },
  {
    method: 'GET',
    path: resendUnknownPath,
    ...resendConfirmationController({ heading: 'Check your email' })
  }
]
