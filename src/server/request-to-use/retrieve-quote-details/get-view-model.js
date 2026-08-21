import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading =
  'Nature Restoration Fund – retrieve your quote details for the Nature Restoration Fund levy'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
