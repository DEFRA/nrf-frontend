import joi from 'joi'
import { emailField } from '../../common/validation/email.js'

export default function formValidation() {
  return joi
    .object({
      email: emailField({ noSpaces: true })
    })
    .prefs({ abortEarly: true })
}
