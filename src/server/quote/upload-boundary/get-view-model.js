import { getPageTitle } from '../../common/helpers/page-title.js'

export const title = 'Upload a red line boundary file'

export default function () {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: '#'
  }
}
