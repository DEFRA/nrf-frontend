// Destinations from the prototype journey (nature-restoration-levy) — pages not
// yet built here: variations confirm the developer details afresh, otherwise
// the journey continues with the user's address
const routeOriginalNrlReference = '/request-to-use/original-nrl-reference'
const routeYourAddress = '/request-to-use/your-address'

export default function getNextPage({ isThisAVariation }) {
  return isThisAVariation === 'yes'
    ? routeOriginalNrlReference
    : routeYourAddress
}
