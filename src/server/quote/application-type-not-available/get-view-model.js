import { getPageTitle } from '../../common/helpers/page-title.js'

const title =
  'Nature restoration levy is not currently available for this planning application type'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: '#'
  }
}
