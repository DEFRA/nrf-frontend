import { getPageTitle } from '../../common/helpers/page-title.js'
import { getWasteWaterTreatmentWorks } from '../../common/services/waste-water-treatment-works.js'
import { routePath as routePathPeopleCount } from '../people-count/routes.js'
import { routePath as routePathResidential } from '../residential/routes.js'

export const title =
  'Confirm which waste water treatment works will be used for this development'

const iDontKnowValue = 'i-dont-know'

export default async function getViewModel(quoteData) {
  const boundaryGeometry = quoteData?.boundaryGeojson?.boundaryGeometryOriginal
  const wasteWaterOptions = await getWasteWaterTreatmentWorks(boundaryGeometry)

  const items = wasteWaterOptions.map((option) => ({
    value: option.id,
    text: option.name,
    hint: {
      text: `${option.distance} km from the development boundary`
    }
  }))

  if (items.length > 0) {
    items.push({
      divider: 'or'
    })
  }

  items.push({
    value: iDontKnowValue,
    text: "I don't know the waste water treatment works yet"
  })

  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: quoteData?.developmentTypes?.includes('other-residential')
      ? routePathPeopleCount
      : routePathResidential,
    wasteWaterItems: items
  }
}
