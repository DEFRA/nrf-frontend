import { describe, it, expect } from 'vitest'
import { quoteController } from './controller-get.js'

describe('quoteController', () => {
  const routeId = 'start'
  const viewModel = { pageTitle: 'Start' }
  const getViewModel = () => viewModel

  it('should render the correct view with the view model', () => {
    const controller = quoteController({ routeId, getViewModel })
    const h = { view: (template, model) => ({ template, model }) }

    const result = controller.handler({}, h)

    expect(result.template).toBe('quote/start/index')
    expect(result.model).toEqual(viewModel)
  })
})
