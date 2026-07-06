import { getPageTitle } from '../../common/helpers/page-title.js'

export const heading = 'Your Nature restoration levy levy quote'

export default function getViewModel(reference) {
  return {
    pageTitle: getPageTitle(`${heading} (${reference})`),
    pageHeading: heading
  }
}
