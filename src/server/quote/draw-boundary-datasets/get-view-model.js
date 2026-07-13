import { getPageTitle } from '../../common/helpers/page-title.js'

export const title = 'Draw your boundary on a map (datasets example)'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title
  }
}
