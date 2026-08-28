export const quoteEmailGetController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const baseViewModel = getViewModel()
    const { reference } = request.query
    console.log(`Rendering ${routeId} page for reference: ${reference}`)

    const viewModel = { ...baseViewModel, reference }
    return h.view(`request-to-use/${routeId}/index`, viewModel)
  }
})
