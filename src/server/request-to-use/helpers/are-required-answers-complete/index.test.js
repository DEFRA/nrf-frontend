import { areRequiredAnswersComplete } from './index.js'
import {
  checkYourAnswersSessions,
  incompleteCheckYourAnswersSessions
} from '../../../../test-utils/fixtures/check-your-answers-sessions.js'

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
      scenario: 'the NRL reference is malformed',
      requestToUse: { ...complete, nrlReference: 'not-a-reference' },
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
