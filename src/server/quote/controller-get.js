export const quoteController = ({ routeId, getViewModel }) => ({
  handler(_request, h) {
    return h.view(`quote/${routeId}/index`, getViewModel())
  }
})
