export const accessibilityController = {
  options: {
    auth: false
  },
  handler(_request, h) {
    return h.view('accessibility/index', {
      pageTitle: 'Accessibility statement'
    })
  }
}
