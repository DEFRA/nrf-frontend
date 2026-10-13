import { describe, it, expect } from 'vitest'
import getViewModel, { pageHeading } from './get-view-model.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'

const validReference = fullQuote.reference

describe('enter-nrl-reference getViewModel', () => {
  it('returns the heading, title and back link', () => {
    const viewModel = getViewModel()
    expect(viewModel.pageHeading).toBe(pageHeading)
    expect(viewModel.pageTitle).toContain(pageHeading)
    expect(viewModel.backLinkPath).toBe(haveNrlReferencePath)
  })

  it('does not return a cancel link', () => {
    expect(getViewModel()).not.toHaveProperty('cancelLinkPath')
  })

  it.each([
    { scenario: 'valid', query: validReference },
    { scenario: 'lowercase', query: 'nrl-123456' },
    { scenario: 'padded with whitespace', query: ` ${validReference} ` }
  ])(
    'pre-fills the normalised reference when the query is $scenario',
    ({ query }) => {
      expect(getViewModel({}, { nrlReference: query }).nrlReference).toBe(
        validReference
      )
    }
  )

  it.each([
    { scenario: 'absent', query: {} },
    { scenario: 'empty', query: { nrlReference: '' } },
    { scenario: 'malformed', query: { nrlReference: 'ABC-123' } },
    {
      scenario: 'repeated',
      query: { nrlReference: [validReference, validReference] }
    }
  ])('does not pre-fill when the query is $scenario', ({ query }) => {
    expect(getViewModel({}, query).nrlReference).toBeUndefined()
  })

  it('pre-fills from the query when there is no session data', () => {
    expect(
      getViewModel(null, { nrlReference: validReference }).nrlReference
    ).toBe(validReference)
  })

  it.each([
    { scenario: 'a previously submitted value', submitted: 'ABC-123' },
    { scenario: 'an empty submitted value', submitted: '' }
  ])('prefers $scenario over the query', ({ submitted }) => {
    const viewModel = getViewModel(
      { nrlReference: submitted },
      { nrlReference: validReference }
    )
    expect(viewModel.nrlReference).toBe(submitted)
  })
})
