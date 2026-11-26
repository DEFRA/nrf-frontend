import { fullQuote, originalNrlReference } from './quote.js'
import { recalculatedLevy } from './levy.js'
import { secondRelationshipId } from './defra-id-org-claims.js'
import { reviewDetailsSessions } from './review-details-personas.js'

// What the pages after the review page add to the enter address answers: the
// NRL reference, the levy calculation, the accepted levy and the planning
// answers of a development that is not an amendment
const acceptedRequest = {
  nrlReference: fullQuote.reference,
  levy: recalculatedLevy,
  acceptLevy: 'yes',
  variation: 'no'
}

// A complete request to use session for each persona, in the shape the pages
// save: the enter address answers with the snapshot of who confirmed them
export const checkYourAnswersSessions = {
  agent: { ...reviewDetailsSessions.agent, ...acceptedRequest },
  employee: { ...reviewDetailsSessions.employee, ...acceptedRequest },
  individual: { ...reviewDetailsSessions.individual, ...acceptedRequest }
}

// The planning answers of an amendment to a planning permission that was
// already committed to the levy, so all three of them apply
export const committedAmendmentAnswers = {
  variation: 'yes',
  originalCommitted: 'yes',
  originalNrlReference
}

const { levy: _calculated, ...answersWithoutLevy } =
  checkYourAnswersSessions.employee
const { acceptLevy: _accepted, ...answersWithoutAcceptedLevy } =
  checkYourAnswersSessions.employee
const { nrlReference: _reference, ...answersWithoutReference } =
  checkYourAnswersSessions.employee
const { variation: _variation, ...answersWithoutAmendment } =
  checkYourAnswersSessions.employee
const { signin: employeeSignin, ...employeeAnswers } =
  checkYourAnswersSessions.employee
const {
  originalNrlReference: _original,
  ...committedAmendmentWithoutReference
} = { ...checkYourAnswersSessions.employee, ...committedAmendmentAnswers }

// The complete answers with one required answer left blank each, for an
// employee unless the answer only applies to an agent.
export const incompleteCheckYourAnswersSessions = {
  withoutLevyCalculation: answersWithoutLevy,
  withoutAcceptedLevy: answersWithoutAcceptedLevy,
  withoutNrlReference: answersWithoutReference,
  withoutAmendmentAnswer: answersWithoutAmendment,
  // An amendment makes the original permission answer apply
  amendmentWithoutOriginalPermission: {
    ...answersWithoutAmendment,
    variation: 'yes'
  },
  // A committed original permission makes its reference apply
  committedWithoutOriginalReference: committedAmendmentWithoutReference,
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
