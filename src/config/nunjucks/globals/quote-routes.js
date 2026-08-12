import { routePath as confirmHousing } from '../../../server/quote/confirm-housing/routes.js'
import { routePath as applicationTypeNotAvailable } from '../../../server/quote/application-type-not-available/routes.js'
import { routePath as planningType } from '../../../server/quote/planning-type/routes.js'
import { routePath as boundaryType } from '../../../server/quote/boundary-type/routes.js'
import { routePath as unitNumber } from '../../../server/quote/unit-number/routes.js'
import { routePath as notInEdp } from '../../../server/quote/not-in-edp/routes.js'
import { routePath as notHousing } from '../../../server/quote/not-housing/routes.js'
import { routePath as email } from '../../../server/quote/email/routes.js'
import { routePath as uploadBoundary } from '../../../server/quote/upload-boundary/routes.js'
import { routePath as drawBoundary } from '../../../server/quote/draw-boundary/routes.js'
import { routePath as checkingFile } from '../../../server/quote/checking-file/routes.js'
import { routePath as filePreview } from '../../../server/quote/file-preview/routes.js'
import { routePath as checkYourAnswers } from '../../../server/quote/check-your-answers/routes.js'
import { routePath as confirmation } from '../../../server/quote/confirmation/routes.js'
import { routePath as deleteQuote } from '../../../server/quote/delete-quote/routes.js'
import { routePath as deleteQuoteConfirmation } from '../../../server/quote/delete-quote-confirmation/routes.js'
import { routePath as quoteDetails } from '../../../server/quote/quote-details/routes.js'
import { routePath as excludedArea } from '../../../server/quote/excluded-area/routes.js'

export const quoteRoutes = {
  confirmHousing,
  applicationTypeNotAvailable,
  planningType,
  boundaryType,
  unitNumber,
  notInEdp,
  notHousing,
  email,
  uploadBoundary,
  drawBoundary,
  checkingFile,
  filePreview,
  checkYourAnswers,
  confirmation,
  deleteQuote,
  deleteQuoteConfirmation,
  quoteDetails,
  excludedArea
}
