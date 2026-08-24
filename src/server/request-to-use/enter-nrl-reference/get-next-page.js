import { routeRetrieveQuoteDetails } from '../retrieve-quote-details/routes.js'

export default function getNextPage({ nrlReference }) {
  return routeRetrieveQuoteDetails
}
