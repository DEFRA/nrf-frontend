import { describe, expect, it } from 'vitest'
import getViewModel from './get-view-model.js'
import { findSummaryListRow } from '../../../test-utils/find-summary-list-row.js'
import { boundaryGeojson } from '../../../test-utils/fixtures/boundary-geojson.js'
import {
  currentRelationshipId,
  firstOrgName
} from '../../../test-utils/fixtures/defra-id-org-claims.js'
import {
  accountFullName,
  agentOrganisationName,
  developerFullName,
  reviewDetailsAddress,
  reviewDetailsSessions
} from '../../../test-utils/fixtures/review-details-personas.js'

// Declared as literals rather than imports: a wrong change to a route must
// fail these tests (tests.md, constants vs literals).
const changeAcceptLevyPath = '/request-to-use/change/accept-levy'
const changeEnterAddressPath = '/request-to-use/change/enter-address'
const readThisPath = '/request-to-use/read-this'
const reviewQuoteDetailsPath = '/request-to-use/review-quote-details'
const changeDeleteQuotePath = '/request-to-use/change/delete-quote-details'

// Row keys are the user-visible summary list contract; consts keep each
// literal to one occurrence (SonarQube S1192).
const rowKeys = {
  acceptLevyAmount: 'Accept levy amount',
  requestingToUseAs: 'Requesting to use the levy as',
  fullName: 'Full name',
  developerBusinessName: 'Developer business name',
  address: 'Address',
  planningPermissionType: 'Planning permission type',
  housing: 'Housing',
  housingUnits: 'Number of housing units',
  redLineBoundary: 'Red line boundary',
  emailAddress: 'Email address'
}

const findDevelopmentDetailsRow = (view, key) =>
  view.developmentDetailsRows.find((row) => row.key.text === key)

const quote = {
  planningType: 'full-planning-permission',
  isHousing: 'yes',
  housingUnits: 42,
  boundaryGeojson,
  email: 'test@example.com'
}

const signedInUser = {
  displayName: accountFullName,
  currentRelationshipId
}

const dataFor = (session) => ({
  session: { quote, requestToUse: session },
  signedInUser
})

const agentData = dataFor({
  ...reviewDetailsSessions.agent,
  acceptLevy: 'yes'
})

const employeeData = dataFor({
  ...reviewDetailsSessions.employee,
  acceptLevy: 'yes'
})

const individualData = dataFor({
  ...reviewDetailsSessions.individual,
  acceptLevy: 'yes'
})

describe('Check your answers view model', () => {
  it('returns the page heading, title and back link to the read this page', () => {
    const view = getViewModel(agentData)

    expect(view.pageHeading).toBe('Check your answers')
    expect(view.pageTitle).toBe(
      'Check your answers - Nature restoration levy - GOV.UK'
    )
    expect(view.backLinkPath).toBe(readThisPath)
  })

  it.each([
    [
      'an agent',
      agentData,
      'A client you act for as an agent or third party',
      developerFullName,
      agentOrganisationName
    ],
    [
      'an employee',
      employeeData,
      'The business or organisation you work for',
      accountFullName,
      firstOrgName
    ],
    [
      'an individual',
      individualData,
      'Yourself, as an individual',
      accountFullName,
      null
    ]
  ])(
    'builds the summary rows for %s',
    (_scenario, data, userType, fullName, businessName) => {
      const view = getViewModel(data)

      expect(
        findSummaryListRow(view, rowKeys.acceptLevyAmount).value.text
      ).toBe('Yes, accept this amount')

      const userTypeRow = findSummaryListRow(view, rowKeys.requestingToUseAs)
      expect(userTypeRow.value.text).toBe(userType)
      expect(userTypeRow.actions).toBeUndefined()

      expect(findSummaryListRow(view, rowKeys.fullName).value.text).toBe(
        fullName
      )

      if (businessName) {
        const businessNameRow = findSummaryListRow(
          view,
          rowKeys.developerBusinessName
        )
        expect(businessNameRow.value.text).toBe(businessName)
        expect(businessNameRow.actions).toBeUndefined()
      } else {
        expect(
          findSummaryListRow(view, rowKeys.developerBusinessName)
        ).toBeUndefined()
      }

      expect(findSummaryListRow(view, rowKeys.address).value.html).toContain(
        reviewDetailsAddress.addressLine1
      )
      expect(findSummaryListRow(view, rowKeys.address).value.html).toContain(
        `<br>${reviewDetailsAddress.postcode}`
      )
    }
  )

  it('drops the saved address when it was entered under a different relationship', () => {
    const view = getViewModel({
      session: {
        quote,
        requestToUse: {
          ...reviewDetailsSessions.agent,
          signin: {
            ...reviewDetailsSessions.agent.signin,
            relationshipId: 'another-relationship'
          }
        }
      },
      signedInUser
    })

    expect(findSummaryListRow(view, rowKeys.address).value.html).toBe('')
  })

  it('links each changeable answer to the page that changes it', () => {
    const view = getViewModel(agentData)

    expect(
      findSummaryListRow(view, rowKeys.acceptLevyAmount).actions.items
    ).toEqual([
      {
        href: changeAcceptLevyPath,
        text: 'Change',
        visuallyHiddenText: 'whether you accept the levy amount'
      }
    ])
    expect(findSummaryListRow(view, rowKeys.fullName).actions.items).toEqual([
      {
        href: changeEnterAddressPath,
        text: 'Change',
        visuallyHiddenText: 'full name'
      }
    ])
    expect(findSummaryListRow(view, rowKeys.address).actions.items).toEqual([
      {
        href: changeEnterAddressPath,
        text: 'Change',
        visuallyHiddenText: 'address'
      }
    ])
  })

  it.each([
    ['an employee', employeeData],
    ['an individual', individualData]
  ])('does not link the full name for %s', (_scenario, data) => {
    const view = getViewModel(data)

    expect(findSummaryListRow(view, rowKeys.fullName).actions).toBeUndefined()
    expect(findSummaryListRow(view, rowKeys.address).actions.items).toEqual([
      {
        href: changeEnterAddressPath,
        text: 'Change',
        visuallyHiddenText: 'address'
      }
    ])
  })

  it('omits rows whose answer is missing', () => {
    const view = getViewModel({})

    expect(findSummaryListRow(view, rowKeys.acceptLevyAmount)).toBeUndefined()
    expect(findSummaryListRow(view, rowKeys.requestingToUseAs)).toBeUndefined()
    expect(findSummaryListRow(view, rowKeys.fullName)).toBeUndefined()
    expect(findSummaryListRow(view, rowKeys.address)).toBeDefined()
  })

  it('builds the development details rows from the saved quote', () => {
    const view = getViewModel(agentData)

    expect(
      findDevelopmentDetailsRow(view, rowKeys.planningPermissionType).value.text
    ).toBe('Full planning permission')
    expect(findDevelopmentDetailsRow(view, rowKeys.housing).value.text).toBe(
      'Yes'
    )
    expect(
      findDevelopmentDetailsRow(view, rowKeys.housingUnits).value.text
    ).toBe(42)
    expect(
      findDevelopmentDetailsRow(view, rowKeys.redLineBoundary).value.text
    ).toBe('Added')
    expect(
      findDevelopmentDetailsRow(view, rowKeys.emailAddress).value.text
    ).toBe('test@example.com')
  })

  it('shows the uploaded boundary filename in place of Added', () => {
    const view = getViewModel({
      ...agentData,
      session: {
        ...agentData.session,
        quote: { ...quote, boundaryFilename: 'boundary.geojson' }
      }
    })

    expect(
      findDevelopmentDetailsRow(view, rowKeys.redLineBoundary).value.text
    ).toBe('boundary.geojson')
  })

  it('omits the housing units row when the development has no housing', () => {
    const view = getViewModel({
      ...agentData,
      session: { ...agentData.session, quote: { ...quote, isHousing: 'no' } }
    })

    expect(
      findDevelopmentDetailsRow(view, rowKeys.housingUnits)
    ).toBeUndefined()
  })

  it('exposes the confirmation checkbox options and the page links', () => {
    const view = getViewModel(agentData)

    expect(view.confirmInformationOptions).toEqual([
      {
        value: 'Yes',
        text: 'I confirm that, to the best of my knowledge and belief, the information provided in the application is true, accurate and complete.'
      }
    ])
    expect(view.reviewQuotePath).toBe(reviewQuoteDetailsPath)
    expect(view.deleteQuotePath).toBe(changeDeleteQuotePath)
  })
})
