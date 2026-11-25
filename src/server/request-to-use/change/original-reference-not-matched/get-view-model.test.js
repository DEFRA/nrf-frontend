import getViewModel from './get-view-model.js'

const changeOriginalReferencePath =
  '/request-to-use/change/original-reference?from=reference-not-matched'

describe('change original-reference-not-matched getViewModel', () => {
  it('keeps the reference in the heading', () => {
    const viewModel = getViewModel({
      session: { requestToUse: { originalNrlReference: 'nrl-123456' } }
    })

    expect(viewModel.pageHeading).toBe('NRL-123456 does not match our records')
  })

  it('links back and to the enter again link on the change original reference page', () => {
    const viewModel = getViewModel({})

    expect(viewModel.backLinkPath).toBe(changeOriginalReferencePath)
    expect(viewModel.enterOriginalReferencePath).toBe(
      changeOriginalReferencePath
    )
  })
})
