import joi from 'joi'

const errorMessage =
  'Select a waste water treatment works, or select that you do not know yet'

export default function formValidation() {
  return joi.object({
    wasteWaterTreatmentWorks: joi.string().required().messages({
      'any.required': errorMessage,
      'string.empty': errorMessage
    })
  })
}
