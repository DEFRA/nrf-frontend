import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdBusinessMemorableWord } from '../defra-id-business-memorable-word/routes.js'

const pageHeading = 'Check your answers'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdBusinessMemorableWord
  }
}
