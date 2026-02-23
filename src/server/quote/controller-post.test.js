import { describe, it, expect } from 'vitest'
import { quotePostController } from './controller-post.js'

describe('quotePostController', () => {
  const routeId = 'start'
  const viewModel = { pageTitle: 'Start' }
  const getViewModel = () => viewModel
  const formValidation = () => () => {}
  const getNextPage = () => '/quote/next'

  it('should redirect to /quote/next on successful submission', () => {
    const controller = quotePostController({
      routeId,
      formValidation,
      getViewModel,
      getNextPage
    })
    const h = { redirect: (path) => ({ redirectTo: path }) }

    const result = controller.handler({}, h)

    expect(result.redirectTo).toBe('/quote/next')
  })

  it('should re-render the view with errors on validation failure', () => {
    const controller = quotePostController({
      routeId,
      formValidation,
      getViewModel,
      getNextPage
    })
    const view = (template, model) => ({
      template,
      model,
      takeover: () => ({ template, model })
    })
    const h = { view }
    const request = { payload: { field1: 'bad value' } }
    const err = { details: [{ path: 'field1', message: 'Required' }] }

    const result = controller.options.validate.failAction(request, h, err)

    expect(result.template).toBe('quote/start/index')
    expect(result.model.formSubmitData).toEqual(request.payload)
    expect(result.model.validationErrors.summary).toHaveLength(1)
    expect(result.model.validationErrors.summary[0].href).toBe('#field1')
    expect(result.model.pageTitle).toEqual('Start')
  })
})
