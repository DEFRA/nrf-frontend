import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as backLinkPath } from '../people-count/routes.js'

export const title =
  'Confirm which waste water treatment works will be used for this development'

const iDontKnowValue = 'i-dont-know'

export default function getViewModel(quoteData) {
  const wasteWaterOptions = quoteData?.wasteWaterOptions ?? []

  const items = wasteWaterOptions.map((option) => ({
    value: option.id,
    text: option.name,
    hint: {
      text: `${option.distance} km from the centre of the development`
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
    backLinkPath,
    wasteWaterItems: items
  }
}
