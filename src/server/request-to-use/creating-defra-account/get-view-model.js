import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = ''
const pageTitle = ''

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading
  }
}
