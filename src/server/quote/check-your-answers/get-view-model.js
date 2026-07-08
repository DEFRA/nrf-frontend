import { getPageTitle } from '../../common/helpers/page-title.js'
import { planningTypeOptions } from '../planning-type/options.js'

export const title = 'Check your answers'

export default function getViewModel({ planningType } = {}) {
  const planningTypeLabel = planningTypeOptions.find(
    (o) => o.value === planningType
  )?.text

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: '/quote/email',
    planningTypeLabel
  }
}
