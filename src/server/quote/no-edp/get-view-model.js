import { getPageTitle } from '../../common/helpers/page-title.js'

const title = 'Nature Restoration Fund levy is not available in this area'

export default function () {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLink: '#'
  }
}
