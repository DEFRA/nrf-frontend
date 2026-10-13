import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as startPagePath } from '../start-page/route-path.js'
import { whatWouldYouLikeToDoOptions } from './options.js'

export const pageHeading = 'What would you like to do?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: startPagePath,
    whatWouldYouLikeToDoOptions
  }
}
