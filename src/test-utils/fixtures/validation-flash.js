import { mapValidationErrorsForDisplay } from '../../server/common/helpers/form-validation.js'
import formValidation from '../../server/request-to-use/check-your-answers/form-validation.js'

// What a failed submit from the check your answers page saves for the page to
// show when its redirect is followed, with nothing ticked. Built as the failed
// submit builds it, so it keeps that shape.
const { error } = formValidation().validate({})

export const validationFlash = {
  validationErrors: mapValidationErrorsForDisplay(error.details),
  formSubmitData: {}
}
