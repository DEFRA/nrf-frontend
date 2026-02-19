export const quoteController = ({ routeId, getViewModel }) => ({
  handler(request, h) {
    return h.view(`quote/${routeId}/index`, getViewModel())
  }
})
