import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'Do you have a NRL reference?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
