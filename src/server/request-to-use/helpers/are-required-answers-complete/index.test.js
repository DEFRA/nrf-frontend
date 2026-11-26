import { areRequiredAnswersComplete } from './index.js'
import {
  checkYourAnswersSessions,
  committedAmendmentAnswers,
  incompleteCheckYourAnswersSessions
} from '../../../../test-utils/fixtures/check-your-answers-sessions.js'
import { malformedReference } from '../../../../test-utils/fixtures/quote.js'

const complete = checkYourAnswersSessions.employee

describe('areRequiredAnswersComplete', () => {
  it.each(['agent', 'employee', 'individual'])(
    'should be complete for an %s who has answered every question',
    (persona) => {
      const session = checkYourAnswersSessions[persona]

      expect(
        areRequiredAnswersComplete({
          requestToUse: session,
          address: session.address
        })
      ).toBe(true)
    }
  )

  it('should be complete when the optional address lines are blank', () => {
    const { address, ...answers } = complete

    expect(
      areRequiredAnswersComplete({
        requestToUse: answers,
        address: { ...address, addressLine2: '', county: '' }
      })
    ).toBe(true)
  })

  it.each([
    {
      scenario: 'the development is an amendment to a committed permission',
      requestToUse: { ...complete, ...committedAmendmentAnswers }
    },
    {
      scenario: 'the original permission was not committed to the levy',
      requestToUse: { ...complete, variation: 'yes', originalCommitted: 'no' }
    },
    {
      scenario:
        'the original permission answer is left over from before the amendment answer changed to no',
      requestToUse: { ...complete, originalCommitted: 'yes' }
    }
  ])('should be complete when $scenario', ({ requestToUse }) => {
    expect(
      areRequiredAnswersComplete({ requestToUse, address: complete.address })
    ).toBe(true)
  })

  it.each([
    { scenario: 'there is no session', requestToUse: null, address: undefined },
    {
      scenario: 'the levy calculation is missing',
      requestToUse: incompleteCheckYourAnswersSessions.withoutLevyCalculation,
      address: complete.address
    },
    {
      scenario: 'the levy amount has not been accepted',
      requestToUse: incompleteCheckYourAnswersSessions.withoutAcceptedLevy,
      address: complete.address
    },
    {
      scenario: 'the NRL reference is missing',
      requestToUse: incompleteCheckYourAnswersSessions.withoutNrlReference,
      address: complete.address
    },
    {
      scenario: 'the amendment answer is missing',
      requestToUse: incompleteCheckYourAnswersSessions.withoutAmendmentAnswer,
      address: complete.address
    },
    {
      scenario:
        'the development is an amendment but the original permission answer is missing',
      requestToUse:
        incompleteCheckYourAnswersSessions.amendmentWithoutOriginalPermission,
      address: complete.address
    },
    {
      scenario:
        'the original permission was committed but its NRL reference is missing',
      requestToUse:
        incompleteCheckYourAnswersSessions.committedWithoutOriginalReference,
      address: complete.address
    },
    {
      scenario: 'the NRL reference is malformed',
      requestToUse: { ...complete, nrlReference: malformedReference },
      address: complete.address
    },
    {
      scenario: 'the original NRL reference is malformed',
      requestToUse: {
        ...complete,
        ...committedAmendmentAnswers,
        originalNrlReference: malformedReference
      },
      address: complete.address
    },
    {
      scenario: 'the levy amount was declined',
      requestToUse: { ...complete, acceptLevy: 'no' },
      address: complete.address
    },
    {
      scenario: 'the user type has not been resolved',
      requestToUse: {
        ...complete,
        signin: { ...complete.signin, actualUserType: undefined }
      },
      address: complete.address
    },
    {
      scenario: 'no address has been entered for the signed in account',
      requestToUse: complete,
      address: undefined
    },
    {
      scenario: 'address line 1 is blank',
      requestToUse: complete,
      address: { ...complete.address, addressLine1: '' }
    },
    {
      scenario: 'the town or city is blank',
      requestToUse: complete,
      address: { ...complete.address, townOrCity: '' }
    },
    {
      scenario: 'the postcode is blank',
      requestToUse: complete,
      address: { ...complete.address, postcode: '' }
    },
    {
      scenario: 'an agent has not entered the full name',
      requestToUse: incompleteCheckYourAnswersSessions.agentWithoutFullName,
      address: incompleteCheckYourAnswersSessions.agentWithoutFullName.address
    }
  ])('should be incomplete when $scenario', ({ requestToUse, address }) => {
    expect(areRequiredAnswersComplete({ requestToUse, address })).toBe(false)
  })
})
