import { getPageTitle } from '../common/helpers/page-title.js'

const pageHeading = 'Accessibility statement'

export const accessibilityController = {
  options: {
    auth: false
  },
  handler(_request, h) {
    return h.view('accessibility/index', {
      pageTitle: getPageTitle(pageHeading),
      pageHeading
    })
  }
}
