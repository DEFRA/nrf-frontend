import joi from 'joi'

const errorMessage = 'Select a planning application type'

export default function () {
  return joi.object({
    planningType: joi
      .string()
      .valid(
        'full-planning-permission',
        'outline-planning-permission',
        'hybrid-planning-permission',
        'other'
      )
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
