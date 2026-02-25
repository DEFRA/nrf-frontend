import { getPageTitle } from '../../common/helpers/page-title.js'

const title =
  'Choose how you would like to show us the boundary of your development'

export default function () {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLink: '/'
  }
}
