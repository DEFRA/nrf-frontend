import { describe, it, expect } from 'vitest'
import { quoteController } from './controller-get.js'
import { getQuoteDataFromCache } from './session-cache.js'

vi.mock('./session-cache.js')

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

  it('should remember the users previous selection', () => {
    vi.mocked(getQuoteDataFromCache).mockReturnValue({
      boundaryEntryType: 'draw'
    })
    const controller = quoteController({ routeId, getViewModel })
    const h = { view: (template, model) => ({ template, model }) }
    const result = controller.handler({}, h)
    expect(result.model.formSubmitData.boundaryEntryType).toBe('draw')
  })
})
