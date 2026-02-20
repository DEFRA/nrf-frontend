export const quoteController = ({ routeId, getViewModel }) => ({
  handler(_request, h) {
    const viewModel = getViewModel()
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
