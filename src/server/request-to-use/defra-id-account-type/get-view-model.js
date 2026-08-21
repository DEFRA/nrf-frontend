import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdWhatWeNeed } from '../defra-id-what-we-need/routes.js'

const pageHeading = 'Are you registering as a business or organisation?'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdWhatWeNeed
  }
}
