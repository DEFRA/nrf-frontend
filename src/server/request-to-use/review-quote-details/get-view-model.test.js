import { describe, expect, it } from 'vitest'
import getViewModel from './get-view-model.js'
import { findSummaryListRow } from '../../../test-utils/find-summary-list-row.js'
import { reviewQuoteSession } from '../../../test-utils/fixtures/session.js'

// What the page controller hands the view model: quote session data merged
// with the NRL reference from the request to use session.
const completeQuote = {
  ...reviewQuoteSession.quote,
  nrlReference: reviewQuoteSession.requestToUse.nrlReference
}

// Row keys and change link hidden texts are the user-visible summary list
// contract; consts keep each literal to one occurrence (SonarQube S1192).
const rowKeys = {
  planningType: 'Planning permission type',
  housing: 'Housing',
  housingUnits: 'Number of housing units',
  boundary: 'Red line boundary',
  email: 'Email address'
}

const expectedRowKeys = [
  rowKeys.planningType,
  rowKeys.housing,
  rowKeys.housingUnits,
  rowKeys.boundary,
  rowKeys.email
]

const boundaryHiddenText = 'red line boundary'
const uploadedBoundaryHiddenText = 'uploaded red line boundary'

describe('Review and amend your quote details view model', () => {
  it('returns the page heading and title', () => {
    const view = getViewModel(completeQuote)

    expect(view.pageHeading).toBe(
      'Review and amend the quote details for NRL-123456'
    )
    expect(view.pageTitle).toBe(
      'Review and amend the quote details for NRL-123456 - Nature restoration levy - GOV.UK'
    )
  })

  it('builds the summary rows in order with the saved answers', () => {
    const view = getViewModel(completeQuote)

    expect(view.rows.map((row) => row.key.text)).toEqual(expectedRowKeys)
    expect(view.rows.map((row) => row.value.text)).toEqual([
      'Full planning permission',
      'Yes',
      42,
      'Added',
      'test@example.com'
    ])
  })

  it.each([
    [rowKeys.planningType, 'planning permission type'],
    [rowKeys.housing, 'whether you are developing housing'],
    [rowKeys.housingUnits, 'number of housing units'],
    [rowKeys.boundary, boundaryHiddenText]
  ])('gives the %s row a placeholder change link', (key, hiddenText) => {
    const row = findSummaryListRow(getViewModel(completeQuote), key)

    expect(row.actions.items).toEqual([
      { href: '#', text: 'Change', visuallyHiddenText: hiddenText }
    ])
  })

  it('gives the email address row no change link', () => {
    const row = findSummaryListRow(getViewModel(completeQuote), rowKeys.email)

    expect(row.actions).toBeUndefined()
  })

  it('omits rows whose answers are missing', () => {
    const view = getViewModel({})

    expect(view.rows.map((row) => row.key.text)).toEqual([rowKeys.boundary])
    expect(findSummaryListRow(view, rowKeys.boundary).value.text).toBe(
      'Not added'
    )
  })

  it('omits the number of housing units row when it has not been answered', () => {
    const view = getViewModel({ ...completeQuote, housingUnits: null })

    expect(view.rows.map((row) => row.key.text)).not.toContain(
      rowKeys.housingUnits
    )
  })

  it('shows No and omits the housing units row when there is no housing', () => {
    const view = getViewModel({ ...completeQuote, isHousing: 'no' })

    expect(findSummaryListRow(view, rowKeys.housing).value.text).toBe('No')
    expect(view.rows.map((row) => row.key.text)).not.toContain(
      rowKeys.housingUnits
    )
  })

  it.each([
    {
      scenario: 'an uploaded boundary file',
      quote: {
        ...completeQuote,
        boundaryEntryType: 'upload',
        boundaryFilename: 'site-plan.geojson'
      },
      text: 'site-plan.geojson',
      hiddenText: uploadedBoundaryHiddenText
    },
    {
      scenario: 'an uploaded boundary file with no stored filename',
      quote: {
        ...completeQuote,
        boundaryEntryType: 'upload',
        boundaryFilename: null
      },
      text: 'Uploaded',
      hiddenText: uploadedBoundaryHiddenText
    },
    {
      scenario: 'a drawn boundary',
      quote: completeQuote,
      text: 'Added',
      hiddenText: boundaryHiddenText
    },
    {
      scenario: 'no boundary added',
      quote: { ...completeQuote, boundaryEntryType: null },
      text: 'Not added',
      hiddenText: boundaryHiddenText
    }
  ])('shows "$text" for $scenario', ({ quote, text, hiddenText }) => {
    const row = findSummaryListRow(getViewModel(quote), rowKeys.boundary)

    expect(row.value.text).toBe(text)
    expect(row.actions.items).toEqual([
      { href: '#', text: 'Change', visuallyHiddenText: hiddenText }
    ])
  })
})
