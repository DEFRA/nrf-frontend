import { describe, expect, it } from 'vitest'
import getViewModel from './get-view-model.js'
import { findSummaryListRow } from '../../../test-utils/find-summary-list-row.js'
import { firstOrgName } from '../../../test-utils/fixtures/defra-id-org-claims.js'
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

const agentData = {
  variant: 'agent',
  accountFullName,
  businessName: agentOrganisationName,
  address: reviewDetailsSessions.agent.address
}

const employeeData = {
  variant: 'employee',
  accountFullName,
  businessName: firstOrgName,
  address: reviewDetailsSessions.employee.address
}

const individualData = {
  variant: 'individual',
  accountFullName,
  businessName: '',
  address: reviewDetailsSessions.individual.address
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

  it('links the agent business name change to the change organisation flow, returning here', () => {
    const row = findSummaryListRow(
      getViewModel(agentData),
      rowKeys.businessName
    )

    expect(row.actions.items).toEqual([
      {
        href: '/auth/change-organisation?redirectTo=%2Frequest-to-use%2Freview-details',
        text: 'Change',
        visuallyHiddenText: 'the business name'
      }
    ])
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

  it('shows the address as one escaped line per saved value, dropping blanks', () => {
    const view = getViewModel(agentData)

    expect(findSummaryListRow(view, rowKeys.address).value.html).toBe(
      `${reviewDetailsAddress.addressLine1}<br>${reviewDetailsAddress.addressLine2}<br>${reviewDetailsAddress.townOrCity}<br>${reviewDetailsAddress.county}<br>${reviewDetailsAddress.postcode}`
    )
  })

  it('escapes user-controlled address lines', () => {
    const view = getViewModel({
      ...agentData,
      address: {
        ...reviewDetailsAddress,
        addressLine1: '<script>alert(1)</script>'
      }
    })

    expect(findSummaryListRow(view, rowKeys.address).value.html).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;<br>Building 2<br>Development<br>Devonshire<br>DV1 6RP'
    )
  })

  it('omits the full name row when there is no name to show', () => {
    const view = getViewModel({ ...individualData, accountFullName: '' })

    expect(view.rows.map((row) => row.key.text)).toEqual([rowKeys.address])
  })
})
