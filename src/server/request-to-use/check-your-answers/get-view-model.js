import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'Check your answers'
const pageTitle = 'Check your answers'

export default function getViewModel() {
  const planningTypeLabel = 'Full planning permission'
  /*const planningTypeLabel = planningTypeOptions.find(
    (o) => o.value === planningType
  )?.text*/

  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#',
    planningTypeLabel
  }
}
