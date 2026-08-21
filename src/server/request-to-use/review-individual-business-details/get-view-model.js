import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePathCheckYourAnswers } from '../check-your-answers/routes.js'
import { businessName } from '../constants.js'
import { routeWhatIsAddressIndividualBusiness } from '../what-is-address-individual-business/routes.js'

const pageHeading = 'Review and confirm your details'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: routeWhatIsAddressIndividualBusiness,
    changePath: routeWhatIsAddressIndividualBusiness,
    confirmPath: routePathCheckYourAnswers,
    businessName
  }
}
