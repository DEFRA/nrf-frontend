import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'Your details have been submitted'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading
  }
}
