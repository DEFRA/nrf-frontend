import { routePath as start } from '../../../server/quote/start/routes.js'
import { routePath as confirmHousing } from '../../../server/quote/confirm-housing/routes.js'
import { routePath as applicationTypeNotAvailable } from '../../../server/quote/application-type-not-available/routes.js'
import { routePath as planningType } from '../../../server/quote/planning-type/routes.js'
import { routePath as boundaryType } from '../../../server/quote/boundary-type/routes.js'
import { routePath as units } from '../../../server/quote/units/routes.js'
import { routePath as noEdp } from '../../../server/quote/no-edp/routes.js'
import { routePath as notHousing } from '../../../server/quote/not-housing/routes.js'
import { routePath as email } from '../../../server/quote/email/routes.js'
import { routePath as uploadBoundary } from '../../../server/quote/upload-boundary/routes.js'
import { routePath as drawBoundary } from '../../../server/quote/draw-boundary/routes.js'
import { routePath as uploadReceived } from '../../../server/quote/upload-received/routes.js'
import { routePath as uploadPreviewMap } from '../../../server/quote/upload-preview-map/routes.js'
import { routePath as checkYourAnswers } from '../../../server/quote/check-your-answers/routes.js'
import { routePath as confirmation } from '../../../server/quote/confirmation/routes.js'
import { routePath as deleteQuote } from '../../../server/quote/delete-quote/routes.js'
import { routePath as deleteQuoteConfirmation } from '../../../server/quote/delete-quote-confirmation/routes.js'
import { routePath as quoteDetails } from '../../../server/quote/quote-details/routes.js'
import { routePath as excludedArea } from '../../../server/quote/excluded-area/routes.js'

export const quoteRoutes = {
  start,
  confirmHousing,
  applicationTypeNotAvailable,
  planningType,
  boundaryType,
  units,
  noEdp,
  notHousing,
  email,
  uploadBoundary,
  drawBoundary,
  uploadReceived,
  uploadPreviewMap,
  checkYourAnswers,
  confirmation,
  deleteQuote,
  deleteQuoteConfirmation,
  quoteDetails,
  excludedArea
}
