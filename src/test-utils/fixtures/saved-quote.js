import { fullQuote } from './quote.js'
import { boundaryGeojson } from './boundary-geojson.js'

// A quote record as the backend returns it for a saved quote.
export const savedQuote = {
  ...fullQuote,
  planningType: 'full-planning-permission',
  housingUnits: 42,
  boundary: {
    userInputType: 'upload',
    filename: 'site-plan.geojson',
    geoJsonWgs84: JSON.stringify(boundaryGeojson)
  }
}
