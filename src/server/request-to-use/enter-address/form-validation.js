import joi from 'joi'

const fullNameErrorMessage = 'Enter the full name'
const addressLine1ErrorMessage =
  'Enter address line 1, typically the building and street'
const townOrCityErrorMessage = 'Enter town or city'
const postcodeErrorMessage = 'Enter postcode'

// The variant is a hidden input set by the server when the form is rendered,
// so it only fails validation when the payload has been tampered with.
const formVariantErrorMessage = 'Enter the details for the request to use'

export default function formValidation() {
  return joi.object({
    formVariant: joi
      .string()
      .valid('individual', 'organisation', 'agent')
      .required()
      .messages({
        'any.required': formVariantErrorMessage,
        'any.only': formVariantErrorMessage
      }),
    fullName: joi
      .string()
      .trim()
      .when('formVariant', {
        is: 'agent',
        then: joi.string().required().messages({
          'string.empty': fullNameErrorMessage,
          'any.required': fullNameErrorMessage
        }),
        otherwise: joi.string().allow('').optional()
      }),
    addressLine1: joi.string().trim().required().messages({
      'string.empty': addressLine1ErrorMessage,
      'any.required': addressLine1ErrorMessage
    }),
    addressLine2: joi.string().trim().allow('').optional(),
    townOrCity: joi.string().trim().required().messages({
      'string.empty': townOrCityErrorMessage,
      'any.required': townOrCityErrorMessage
    }),
    county: joi.string().trim().allow('').optional(),
    postcode: joi
      .string()
      .trim()
      // Accept postcodes in any format: strip punctuation, collapse spaces and
      // uppercase rather than rejecting the value.
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, ' ')
      .uppercase()
      .required()
      .messages({
        'string.empty': postcodeErrorMessage,
        'any.required': postcodeErrorMessage
      })
  })
}
