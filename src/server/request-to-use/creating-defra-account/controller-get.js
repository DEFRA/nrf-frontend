export const creatingDefraAccountGetController = ({
  routeId,
  getViewModel
}) => ({
  async handler(request, h) {
    const baseViewModel = getViewModel()
    const viewModel = { ...baseViewModel }
    return h.view(`request-to-use/${routeId}/index`, viewModel)
  }
})
