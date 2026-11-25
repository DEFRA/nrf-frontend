import getViewModel from './get-view-model.js'

const changeOriginalReferencePath =
  '/request-to-use/change/original-reference?from=boundary-not-matched'

const input = {
  session: { requestToUse: { originalNrlReference: 'nrl-123456' } }
}

describe('change original-boundary-not-matched getViewModel', () => {
  it('keeps the reference in the body', () => {
    expect(getViewModel(input).originalNrlReference).toBe('NRL-123456')
  })

  it('links back and to the check reference link on the change original reference page', () => {
    const viewModel = getViewModel(input)

    expect(viewModel.backLinkPath).toBe(changeOriginalReferencePath)
    expect(viewModel.originalReferencePath).toBe(changeOriginalReferencePath)
  })

  it('links to the review quote details page to amend the boundary', () => {
    expect(getViewModel(input).reviewQuoteDetailsPath).toBe(
      '/request-to-use/review-quote-details'
    )
  })
})
