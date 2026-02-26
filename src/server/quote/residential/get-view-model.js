import { getPageTitle } from '../../common/helpers/page-title.js'

const title = 'How many residential units in this development?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLink: '#'
  }
}
