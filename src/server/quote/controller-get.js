export const quoteController = {
  handler(request, h) {
    const { slug } = request.params

    return h.view(`quote/${slug}/index`, {})
  }
}
