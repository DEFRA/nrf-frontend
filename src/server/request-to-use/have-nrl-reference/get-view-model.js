import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as whatWouldYouLikeToDoPath } from '../../manage/what-would-you-like-to-do/route-path.js'
import { hasNrlReferenceOptions } from './options.js'

export const pageHeading = 'Do you have an NRL reference?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: whatWouldYouLikeToDoPath,
    hasNrlReferenceOptions
  }
}
