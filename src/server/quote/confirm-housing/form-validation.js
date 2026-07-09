import joi from 'joi'

const errorMessage = 'Select yes if you are developing housing'

export default function formValidation() {
  return joi.object({
    isHousing: joi.string().valid('yes', 'no').required().messages({
      'any.required': errorMessage,
      'any.only': errorMessage
    })
  })
}
