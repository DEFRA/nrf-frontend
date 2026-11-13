import joi from 'joi'

const maxTextLength = 255
const maxPostcodeLength = 10

const fullNameErrorMessage = 'Enter the full name'
const addressLine1ErrorMessage =
  'Enter address line 1, typically the building and street'
const townOrCityErrorMessage = 'Enter town or city'
const postcodeErrorMessage = 'Enter postcode'

// The variant is a hidden input set by the server when the form is rendered,
// so it only fails validation when the payload has been tampered with or is
// from a stale render (the POST route bounces those back to a fresh form).
const formVariantErrorMessage = 'Enter the details for the request to use'

const maxLengthMessage = (field) =>
  `${field} must be ${maxTextLength} characters or fewer`

export default function formValidation() {
  return joi.object({
    formVariant: joi
      .string()
      .valid('individual', 'employee', 'agent')
      .required()
      .messages({
        'any.required': formVariantErrorMessage,
        'any.only': formVariantErrorMessage
      }),
    fullName: joi
      .string()
      .trim()
      .max(maxTextLength)
      .messages({ 'string.max': maxLengthMessage('Full name') })
      .when('formVariant', {
        is: 'agent',
        then: joi.string().required().messages({
          'string.empty': fullNameErrorMessage,
          'any.required': fullNameErrorMessage
        }),
        otherwise: joi.string().allow('').optional()
      }),
    addressLine1: joi
      .string()
      .trim()
      .max(maxTextLength)
      .required()
      .messages({
        'string.empty': addressLine1ErrorMessage,
        'any.required': addressLine1ErrorMessage,
        'string.max': maxLengthMessage('Address line 1')
      }),
    addressLine2: joi
      .string()
      .trim()
      .max(maxTextLength)
      .allow('')
      .optional()
      .messages({ 'string.max': maxLengthMessage('Address line 2') }),
    townOrCity: joi
      .string()
      .trim()
      .max(maxTextLength)
      .required()
      .messages({
        'string.empty': townOrCityErrorMessage,
        'any.required': townOrCityErrorMessage,
        'string.max': maxLengthMessage('Town or city')
      }),
    county: joi
      .string()
      .trim()
      .max(maxTextLength)
      .allow('')
      .optional()
      .messages({ 'string.max': maxLengthMessage('County') }),
    postcode: joi
      .string()
      .trim()
      // Accept postcodes in any format: strip punctuation, collapse spaces,
      // uppercase and restore the missing space rather than rejecting the
      // value.
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .uppercase()
      .replace(/^([A-Z0-9]{2,4})([A-Z0-9]{3})$/, '$1 $2')
      .max(maxPostcodeLength)
      .required()
      .messages({
        'string.empty': postcodeErrorMessage,
        'any.required': postcodeErrorMessage,
        'string.max': `Postcode must be ${maxPostcodeLength} characters or fewer`
      })
  })
}
