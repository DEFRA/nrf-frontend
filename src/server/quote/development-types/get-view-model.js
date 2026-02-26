import { getPageTitle } from '../../common/helpers/page-title.js'

const title = 'What type of development is it?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLink: '#'
  }
}
