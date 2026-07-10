import {
  isAnalyticsDisabled,
  setDisableAnalyticsCookie,
  clearDisableAnalyticsCookie
} from '../cookies/helpers/cookie-service.js'
import { ANALYTICS_INTERNAL_ROUTE } from '../cookies/helpers/constants.js'
import { statusCodes } from '../common/constants/status-codes.js'
import joi from 'joi'

const VIEW = 'analytics-internal/templates/index'
const PAGE_TITLE = 'Enable analytics and audit events'

export const analyticsInternalController = {
  options: { auth: false },
  handler(request, h) {
    return h.view(VIEW, {
      pageTitle: PAGE_TITLE,
      pageHeading: PAGE_TITLE,
      analyticsEnabled: !isAnalyticsDisabled(request)
    })
  }
}

export const analyticsInternalSubmitController = {
  options: {
    auth: false,
    validate: {
      payload: joi.object({
        csrfToken: joi.string().allow(''),
        analyticsEnabled: joi.string().valid('yes', 'no').default('yes')
      })
    }
  },
  handler(request, h) {
    const response = h
      .redirect(ANALYTICS_INTERNAL_ROUTE)
      .code(statusCodes.redirectAfterPost)

    if (request.payload.analyticsEnabled === 'no') {
      setDisableAnalyticsCookie(response)
    } else {
      clearDisableAnalyticsCookie(response)
    }

    return response
  }
}
