import { describe, it, expect } from 'vitest'
import getViewModel, { pageHeading } from './get-view-model.js'
import { routePath as enterNrlReferencePath } from '../enter-nrl-reference/route-path.js'

describe('enter-email getViewModel', () => {
  it('returns the heading, title and back link', () => {
    const viewModel = getViewModel()
    expect(viewModel.pageHeading).toBe(pageHeading)
    expect(viewModel.pageTitle).toContain(pageHeading)
    expect(viewModel.backLinkPath).toBe(enterNrlReferencePath)
  })

  it('does not return a cancel link', () => {
    expect(getViewModel()).not.toHaveProperty('cancelLinkPath')
  })
})
