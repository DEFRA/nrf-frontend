import joi from 'joi'

const errorMessage = 'Select a development type to continue'

export default function formValidation() {
  return joi.object({
    developmentTypes: joi
      .array()
      .items(joi.string().valid('housing', 'other-residential'))
      .single()
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
