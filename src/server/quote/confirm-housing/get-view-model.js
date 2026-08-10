import { routePath as planningTypePath } from '../planning-type/routes.js'

export default function getViewModel() {
  return {
    pageTitle:
      'Are you developing housing units? - Nature restoration levy - GOV.UK',
    pageHeading: 'Are you developing housing units?',
    backLinkPath: planningTypePath
  }
}
