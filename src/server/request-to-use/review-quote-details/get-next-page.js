// Happy path from the prototype journey (nature-restoration-levy). The
// prototype also branches to not-enough-capacity (over 500 housing units) and
// levy-amount-increased (stale quote) — those depend on quote data from the
// backend, so they need wiring once the quote lookup is real. accept-levy-amount
// is not yet built here.
const routeAcceptLevyAmount = '/request-to-use/levy-amount-increased'

export default function getNextPage() {
  return routeAcceptLevyAmount
}
