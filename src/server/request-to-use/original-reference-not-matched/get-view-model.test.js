import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

const reference = 'NRL-654321'
const expectedHeading = `${reference} does not match our records`
const enterOriginalReferencePath = '/request-to-use/original-reference'

describe('original-reference-not-matched getViewModel', () => {
  it('should put the saved reference in the heading and title', () => {
    const viewModel = getViewModel({ originalNrlReference: reference })

    expect(viewModel.pageHeading).toBe(expectedHeading)
    expect(viewModel.pageTitle).toContain(expectedHeading)
  })

  it('should uppercase a lowercase saved reference', () => {
    expect(
      getViewModel({ originalNrlReference: reference.toLowerCase() })
        .pageHeading
    ).toBe(expectedHeading)
  })

  it.each([
    { scenario: 'there is no session data', data: null },
    { scenario: 'the reference is missing', data: {} },
    { scenario: 'the reference is empty', data: { originalNrlReference: '' } }
  ])('should use the fallback heading when $scenario', ({ data }) => {
    expect(getViewModel(data).pageHeading).toBe(
      'This NRL reference does not match our records'
    )
  })

  it('should link back to, and content-link to, the enter the original reference page', () => {
    const viewModel = getViewModel({ originalNrlReference: reference })

    expect(viewModel.backLinkPath).toBe(enterOriginalReferencePath)
    expect(viewModel.enterOriginalReferencePath).toBe(
      enterOriginalReferencePath
    )
  })
})
