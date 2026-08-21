import { getPageTitle } from '../../common/helpers/page-title.js'
import { planningTypeOptions } from '../../quote/planning-type/options.js'

const pageHeading = 'Check your answers'
const pageTitle = 'Check your answers'

export default function getViewModel({ planningType }) {
  const planningTypeLabel = planningTypeOptions.find(
    (o) => o.value === planningType
  )?.text

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#',
    planningTypeLabel
  }
}
