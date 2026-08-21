import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdSelectAddress } from '../defra-id-select-address/routes.js'

const pageHeading = 'Create a memorable word'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdSelectAddress
  }
}
