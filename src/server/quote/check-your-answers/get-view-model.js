import { getPageTitle } from '../../common/helpers/page-title.js'
import { planningTypeOptions } from '../planning-type/options.js'

export const title = 'Check your answers'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: '/quote/email',
    planningTypeOptions
  }
}
