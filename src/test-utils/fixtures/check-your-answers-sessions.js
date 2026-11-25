import { fullQuote } from './quote.js'
import { recalculatedLevy } from './levy.js'
import { secondRelationshipId } from './defra-id-org-claims.js'
import { reviewDetailsSessions } from './review-details-personas.js'

// What the pages after the review page add to the enter address answers: the
// NRL reference, the levy calculation and the accepted levy
const acceptedRequest = {
  nrlReference: fullQuote.reference,
  levy: recalculatedLevy,
  acceptLevy: 'yes'
}

// A complete request to use session for each persona, in the shape the pages
// save: the enter address answers with the snapshot of who confirmed them
export const checkYourAnswersSessions = {
  agent: { ...reviewDetailsSessions.agent, ...acceptedRequest },
  employee: { ...reviewDetailsSessions.employee, ...acceptedRequest },
  individual: { ...reviewDetailsSessions.individual, ...acceptedRequest }
}

const { levy: _calculated, ...answersWithoutLevy } =
  checkYourAnswersSessions.employee
const { acceptLevy: _accepted, ...answersWithoutAcceptedLevy } =
  checkYourAnswersSessions.employee
const { nrlReference: _reference, ...answersWithoutReference } =
  checkYourAnswersSessions.employee
const { signin: employeeSignin, ...employeeAnswers } =
  checkYourAnswersSessions.employee

// The complete answers with one required answer left blank each, for an
// employee unless the answer only applies to an agent.
export const incompleteCheckYourAnswersSessions = {
  withoutLevyCalculation: answersWithoutLevy,
  withoutAcceptedLevy: answersWithoutAcceptedLevy,
  withoutNrlReference: answersWithoutReference,
  // The address is only read back while it was entered under the signed in
  // relationship
  addressForAnotherAccount: {
    ...employeeAnswers,
    signin: { ...employeeSignin, relationshipId: secondRelationshipId }
  },
  agentWithoutFullName: {
    ...checkYourAnswersSessions.agent,
    address: { ...checkYourAnswersSessions.agent.address, fullName: '' }
  }
}
