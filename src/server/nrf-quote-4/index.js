import {
  startController,
  whatWouldYouLikeToDoController,
  doYouHaveNrfRefController,
  enterEstimateRefController,
  retrieveEstimateEmailController,
  estimateEmailController,
  retrievedEstimateSummaryController,
  planningRefController,
  buildingTypeController,
  residentialController,
  nonResidentialController,
  roomCountController,
  companyDetailsController,
  mapController,
  redlineMapController,
  uploadRedlineController,
  uploadDecisionNoticeController,
  noEdpController,
  lpaConfirmController,
  decisionNoticeConfirmationController,
  summaryController,
  summaryAndDeclarationController,
  paymentSummaryController,
  paymentSummarySubmitController,
  payHowWouldYouLikeToSignInController,
  paySignInGovernmentGatewayController,
  paymentConfirmationController,
  commitConfirmationController,
  commitHowWouldYouLikeToSignInController,
  commitSignInGovernmentGatewayController,
  quoteConfirmationController,
  quoteEmailContentController,
  commitEmailContentController,
  paymentRequestEmailContentController,
  payEmailContentController,
  estimateEmailRetrievalContentController
} from './controller.js'

export const nrfQuote = {
  plugin: {
    name: 'nrf-quote',
    register(server) {
      // GET routes - render pages
      server.route([
        // Entry
        {
          method: 'GET',
          path: '/nrf-quote-4/start',
          ...startController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/what-would-you-like-to-do',
          ...whatWouldYouLikeToDoController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/do-you-have-a-nrf-ref',
          ...doYouHaveNrfRefController,
          options: {
            auth: false
          }
        },
        // Estimate retrieval
        {
          method: 'GET',
          path: '/nrf-quote-4/enter-estimate-ref',
          ...enterEstimateRefController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/retrieve-estimate-email',
          ...retrieveEstimateEmailController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/estimate-email',
          ...estimateEmailController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/retrieved-estimate-summary',
          ...retrievedEstimateSummaryController,
          options: {
            auth: false
          }
        },
        // Quote journey
        {
          method: 'GET',
          path: '/nrf-quote-4/planning-ref',
          ...planningRefController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/building-type',
          ...buildingTypeController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/residential',
          ...residentialController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/non-residential',
          ...nonResidentialController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/room-count',
          ...roomCountController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/company-details',
          ...companyDetailsController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/map',
          ...mapController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/redline-map',
          ...redlineMapController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/upload-redline',
          ...uploadRedlineController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/upload-decision-notice',
          ...uploadDecisionNoticeController,
          options: {
            auth: false
          }
        },
        // Decisions
        {
          method: 'GET',
          path: '/nrf-quote-4/no-edp',
          ...noEdpController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/lpa-confirm',
          ...lpaConfirmController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/decision-notice-confirmation',
          ...decisionNoticeConfirmationController,
          options: {
            auth: false
          }
        },
        // Summary
        {
          method: 'GET',
          path: '/nrf-quote-4/summary',
          ...summaryController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/summary-and-declaration',
          ...summaryAndDeclarationController,
          options: {
            auth: false
          }
        },
        // Payment
        {
          method: 'GET',
          path: '/nrf-quote-4/payment-summary',
          ...paymentSummaryController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/pay-how-would-you-like-to-sign-in',
          ...payHowWouldYouLikeToSignInController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/pay-sign-in-government-gateway',
          ...paySignInGovernmentGatewayController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/payment-confirmation',
          ...paymentConfirmationController,
          options: {
            auth: false
          }
        },
        // Sign-in pages
        {
          method: 'GET',
          path: '/nrf-quote-4/commit-confirmation',
          ...commitConfirmationController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/commit-how-would-you-like-to-sign-in',
          ...commitHowWouldYouLikeToSignInController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/commit-sign-in-government-gateway',
          ...commitSignInGovernmentGatewayController,
          options: {
            auth: false
          }
        },
        // Confirmation and emails
        {
          method: 'GET',
          path: '/nrf-quote-4/quote-confirmation',
          ...quoteConfirmationController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/quote-email-content',
          ...quoteEmailContentController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/commit-email-content',
          ...commitEmailContentController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/payment-request-email-content',
          ...paymentRequestEmailContentController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/pay-email-content',
          ...payEmailContentController,
          options: {
            auth: false
          }
        },
        {
          method: 'GET',
          path: '/nrf-quote-4/estimate-email-retrieval-content',
          ...estimateEmailRetrievalContentController,
          options: {
            auth: false
          }
        }
      ])

      // POST routes - form submissions
      server.route([
        {
          method: 'POST',
          path: '/nrf-quote-4/start',
          ...startController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/what-would-you-like-to-do',
          ...whatWouldYouLikeToDoController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/do-you-have-a-nrf-ref',
          ...doYouHaveNrfRefController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/enter-estimate-ref',
          ...enterEstimateRefController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/planning-ref',
          ...planningRefController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/building-type',
          ...buildingTypeController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/residential',
          ...residentialController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/non-residential',
          ...nonResidentialController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/room-count',
          ...roomCountController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/company-details',
          ...companyDetailsController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/map',
          ...mapController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/redline-map',
          ...redlineMapController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/upload-redline',
          ...uploadRedlineController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/upload-decision-notice',
          ...uploadDecisionNoticeController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/summary',
          ...summaryController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/summary-and-declaration',
          ...summaryAndDeclarationController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/nrf-quote-4/payment-summary',
          ...paymentSummarySubmitController,
          options: {
            auth: false
          }
        }
      ])
    }
  }
}
