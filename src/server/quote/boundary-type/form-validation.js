import joi from 'joi'

const errorMessage = 'Select if you would like to draw a map or upload a file'

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
