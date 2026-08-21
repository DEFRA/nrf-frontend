import { getPageTitle } from '../../common/helpers/page-title.js'
import { routeDefraIdMemorableWord } from '../defra-id-memorable-word/routes.js'

const pageHeading = 'Check your answers'
const pageTitle = pageHeading

export default function () {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeDefraIdMemorableWord
  }
}
