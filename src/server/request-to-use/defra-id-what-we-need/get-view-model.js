import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdTerms } from '../defra-id-terms/routes.js'

const pageHeading = 'What we need from you'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdTerms
  }
}
