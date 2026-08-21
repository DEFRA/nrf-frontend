// Destinations from the prototype journey (nature-restoration-levy) — pages not
// yet built here: is-this-a-variation continues the journey, start deletes the
// quote details and returns the user to the beginning
const routeIsThisAVariation = '/request-to-use/is-this-a-variation'
const routeStart = '/request-to-use/start'

export default function getNextPage({
  yourLevyAmountHasIncreasedSinceYourQuote
}) {
  return yourLevyAmountHasIncreasedSinceYourQuote === 'yes'
    ? routeIsThisAVariation
    : routeStart
}
