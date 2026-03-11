import joi from 'joi'

export default function () {
  return joi.object({
    confirmDeleteQuote: joi.string().valid('Yes').required()
  })
}
