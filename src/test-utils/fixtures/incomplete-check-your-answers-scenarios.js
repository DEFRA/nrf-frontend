import { incompleteCheckYourAnswersSessions } from './check-your-answers-sessions.js'
import { agentClaims, singleOrgEmployeeClaims } from './defra-id-org-claims.js'

// The complete request to use answers with one required answer left blank
// each, and the claims of the persona who gave them. An address only counts
// while it was entered under the signed in Defra ID relationship.
export const incompleteCheckYourAnswersScenarios = [
  {
    scenario: 'the levy calculation is missing',
    claims: singleOrgEmployeeClaims,
    session: incompleteCheckYourAnswersSessions.withoutLevyCalculation
  },
  {
    scenario: 'the levy amount has not been accepted',
    claims: singleOrgEmployeeClaims,
    session: incompleteCheckYourAnswersSessions.withoutAcceptedLevy
  },
  {
    scenario: 'the NRL reference is missing',
    claims: singleOrgEmployeeClaims,
    session: incompleteCheckYourAnswersSessions.withoutNrlReference
  },
  {
    scenario: 'the address was entered under another Defra ID account',
    claims: singleOrgEmployeeClaims,
    session: incompleteCheckYourAnswersSessions.addressForAnotherAccount
  },
  {
    scenario: 'an agent has not entered the full name',
    claims: agentClaims,
    session: incompleteCheckYourAnswersSessions.agentWithoutFullName
  },
  {
    scenario: 'the amendment answer is missing',
    claims: singleOrgEmployeeClaims,
    session: incompleteCheckYourAnswersSessions.withoutAmendmentAnswer
  },
  {
    scenario:
      'the development is an amendment but the original permission answer is missing',
    claims: singleOrgEmployeeClaims,
    session:
      incompleteCheckYourAnswersSessions.amendmentWithoutOriginalPermission
  },
  {
    scenario:
      'the original permission was committed but its NRL reference is missing',
    claims: singleOrgEmployeeClaims,
    session:
      incompleteCheckYourAnswersSessions.committedWithoutOriginalReference
  }
]
