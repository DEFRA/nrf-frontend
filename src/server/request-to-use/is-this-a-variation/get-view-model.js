import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading =
  'Is the development a variation to a planning application that was committed to using the nature restoration levy?'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
