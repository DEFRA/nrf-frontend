import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'
import { originalNrlReference as reference } from '../../../test-utils/fixtures/quote.js'

const sessionWith = (originalNrlReference) => ({
  session: { requestToUse: { originalNrlReference } }
})

describe('original-boundary-not-matched getViewModel', () => {
  it('should use the fixed heading in the heading and title', () => {
    const viewModel = getViewModel(sessionWith(reference))

    expect(viewModel.pageHeading).toBe('Details do not match')
    expect(viewModel.pageTitle).toContain('Details do not match')
  })

  it('should uppercase the saved reference', () => {
    expect(
      getViewModel(sessionWith(reference.toLowerCase())).originalNrlReference
    ).toBe(reference)
  })

  it('should link back and to the check reference link on the original reference page', () => {
    const viewModel = getViewModel(sessionWith(reference))

    expect(viewModel.backLinkPath).toBe('/request-to-use/original-reference')
    expect(viewModel.originalReferencePath).toBe(
      '/request-to-use/original-reference'
    )
  })

  it('should link to the review quote details page to amend the boundary', () => {
    expect(getViewModel(sessionWith(reference)).reviewQuoteDetailsPath).toBe(
      '/request-to-use/review-quote-details'
    )
  })
})
