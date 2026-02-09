/**
 * NRF Quote 4 Controllers
 * Each page is handled by a simple controller that renders the template
 */

export const startController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/start.njk')
  }
}

export const whatWouldYouLikeToDoController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/what-would-you-like-to-do.njk')
  }
}

export const doYouHaveNrfRefController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/do-you-have-a-nrf-ref.njk')
  }
}

export const enterEstimateRefController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/enter-estimate-ref.njk')
  }
}

export const retrieveEstimateEmailController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/retrieve-estimate-email.njk')
  }
}

export const estimateEmailController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/estimate-email.njk')
  }
}

export const retrievedEstimateSummaryController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/retrieved-estimate-summary.njk')
  }
}

export const planningRefController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/planning-ref.njk')
  }
}

export const buildingTypeController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/building-type.njk')
  }
}

export const residentialController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/residential.njk')
  }
}

export const nonResidentialController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/non-residential.njk')
  }
}

export const roomCountController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/room-count.njk')
  }
}

export const companyDetailsController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/company-details.njk')
  }
}

export const mapController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/map.njk')
  }
}

export const redlineMapController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/redline-map.njk')
  }
}

export const uploadRedlineController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/upload-redline.njk')
  }
}

export const uploadDecisionNoticeController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/upload-decision-notice.njk')
  }
}

export const noEdpController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/no-edp.njk')
  }
}

export const lpaConfirmController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/lpa-confirm.njk')
  }
}

export const decisionNoticeConfirmationController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/decision-notice-confirmation.njk')
  }
}

export const summaryController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/summary.njk')
  }
}

export const summaryAndDeclarationController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/summary-and-declaration.njk')
  }
}

export const paymentSummaryController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/payment-summary.njk')
  }
}

export const paymentSummarySubmitController = {
  handler(request, h) {
    // TODO: Handle form submission
    console.log('Payment summary submitted:', request.payload)
    return h.redirect('/nrf-quote-4/payment-summary')
  }
}

export const payHowWouldYouLikeToSignInController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/pay-how-would-you-like-to-sign-in.njk')
  }
}

export const paySignInGovernmentGatewayController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/pay-sign-in-government-gateway.njk')
  }
}

export const paymentConfirmationController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/payment-confirmation.njk')
  }
}

export const commitConfirmationController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/commit-confirmation.njk')
  }
}

export const commitHowWouldYouLikeToSignInController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/commit-how-would-you-like-to-sign-in.njk')
  }
}

export const commitSignInGovernmentGatewayController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/commit-sign-in-government-gateway.njk')
  }
}

export const quoteConfirmationController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/quote-confirmation.njk')
  }
}

export const quoteEmailContentController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/quote-email-content.njk')
  }
}

export const commitEmailContentController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/commit-email-content.njk')
  }
}

export const paymentRequestEmailContentController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/payment-request-email-content.njk')
  }
}

export const payEmailContentController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/pay-email-content.njk')
  }
}

export const estimateEmailRetrievalContentController = {
  handler(_request, h) {
    return h.view('nrf-quote-4/estimate-email-retrieval-content.njk')
  }
}
