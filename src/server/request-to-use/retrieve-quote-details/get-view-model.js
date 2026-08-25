import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading =
  'Nature restoration levy – retrieve your quote details for the nature restoration levy'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
