import joi from 'joi'

const errorMessage = 'Select how you would like to show your red line boundary'

export default function () {
  return joi.object({
    boundaryEntryType: joi
      .string()
      .valid('draw', 'upload')
      .required()
      .messages({
        'any.required': errorMessage,
        'any.only': errorMessage
      })
  })
}
