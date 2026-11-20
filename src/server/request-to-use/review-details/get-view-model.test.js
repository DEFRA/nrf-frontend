import { describe, expect, it } from 'vitest'
import getViewModel from './get-view-model.js'
import { findSummaryListRow } from '../../../test-utils/find-summary-list-row.js'
import { currentRelationshipId } from '../../../test-utils/fixtures/defra-id-org-claims.js'
import {
  accountFullName,
  agentOrganisationName,
  developerFullName,
  reviewDetailsAddress,
  reviewDetailsSessions
} from '../../../test-utils/fixtures/review-details-personas.js'

// Declared as a literal rather than imported: a wrong change to the route must
// fail this test (tests.md, constants vs literals).
const enterAddressPath = '/request-to-use/enter-address'

// Row keys and change link hidden texts are the user-visible summary list
// contract; consts keep each literal to one occurrence (SonarQube S1192).
const rowKeys = {
  fullName: 'Full name',
  businessName: 'Business name',
  address: 'Address'
}

const signedInUser = { displayName: accountFullName, currentRelationshipId }

const agentData = {
  session: { requestToUse: reviewDetailsSessions.agent },
  signedInUser
}

const employeeData = {
  session: { requestToUse: reviewDetailsSessions.employee },
  signedInUser
}

const individualData = {
  session: { requestToUse: reviewDetailsSessions.individual },
  signedInUser
}

describe('Review and confirm the developer details view model', () => {
  it.each([
    [
      'an agent',
      agentData,
      'Review and confirm the developer details',
      'Developer details'
    ],
    [
      'an employee',
      employeeData,
      'Review and confirm your details',
      'Your details'
    ],
    [
      'an individual',
      individualData,
      'Review and confirm your details',
      'Your details'
    ]
  ])(
    'returns the heading, title and section heading for %s',
    (_, data, heading, sectionHeading) => {
      const view = getViewModel(data)

      expect(view.pageHeading).toBe(heading)
      expect(view.pageTitle).toBe(
        `${heading} - Nature restoration levy - GOV.UK`
      )
      expect(view.sectionHeading).toBe(sectionHeading)
    }
  )

  it('links back to the enter address page', () => {
    expect(getViewModel(agentData).backLinkPath).toBe(enterAddressPath)
  })

  it('builds the agent rows in order with the saved answers', () => {
    const view = getViewModel(agentData)

    expect(view.rows.map((row) => row.key.text)).toEqual([
      rowKeys.fullName,
      rowKeys.businessName,
      rowKeys.address
    ])
    expect(findSummaryListRow(view, rowKeys.fullName).value.text).toBe(
      developerFullName
    )
    expect(findSummaryListRow(view, rowKeys.businessName).value.text).toBe(
      agentOrganisationName
    )
  })

  it('reviews the account name, not the saved full name, for an employee or individual', () => {
    for (const data of [employeeData, individualData]) {
      expect(
        findSummaryListRow(getViewModel(data), rowKeys.fullName).value.text
      ).toBe(accountFullName)
    }
  })

  it('omits the business name row for an individual', () => {
    const view = getViewModel(individualData)

    expect(view.rows.map((row) => row.key.text)).toEqual([
      rowKeys.fullName,
      rowKeys.address
    ])
  })

  it('links the agent full name and address changes to the enter address page', () => {
    const view = getViewModel(agentData)

    expect(findSummaryListRow(view, rowKeys.fullName).actions.items).toEqual([
      {
        href: enterAddressPath,
        text: 'Change',
        visuallyHiddenText: "the developer's full name"
      }
    ])
    expect(findSummaryListRow(view, rowKeys.address).actions.items).toEqual([
      {
        href: enterAddressPath,
        text: 'Change',
        visuallyHiddenText: "the developer's address"
      }
    ])
  })

  it('gives the agent business name row no change link', () => {
    const row = findSummaryListRow(
      getViewModel(agentData),
      rowKeys.businessName
    )

    expect(row.actions).toBeUndefined()
  })

  it('gives the employee full name and business name rows no change link', () => {
    const view = getViewModel(employeeData)

    expect(findSummaryListRow(view, rowKeys.fullName).actions).toBeUndefined()
    expect(
      findSummaryListRow(view, rowKeys.businessName).actions
    ).toBeUndefined()
    expect(findSummaryListRow(view, rowKeys.address).actions.items).toEqual([
      {
        href: enterAddressPath,
        text: 'Change',
        visuallyHiddenText: 'your address'
      }
    ])
  })

  it('shows the saved address as the address row value', () => {
    const view = getViewModel(agentData)

    expect(findSummaryListRow(view, rowKeys.address).value.html).toBe(
      `${reviewDetailsAddress.addressLine1}<br>${reviewDetailsAddress.addressLine2}<br>${reviewDetailsAddress.townOrCity}<br>${reviewDetailsAddress.county}<br>${reviewDetailsAddress.postcode}`
    )
  })

  it('omits the full name row when there is no name to show', () => {
    const view = getViewModel({
      ...individualData,
      signedInUser: { ...signedInUser, displayName: '' }
    })

    expect(view.rows.map((row) => row.key.text)).toEqual([rowKeys.address])
  })

  it('continues to the details to read page', () => {
    expect(getViewModel(agentData).continuePath).toBe(
      '/request-to-use/read-this'
    )
  })
})
