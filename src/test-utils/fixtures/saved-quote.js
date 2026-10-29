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
    // The backend maps this from PostGIS (ST_AsGeoJSON), so it is the checked
    // WGS84 geometry alone — not the boundary check response blob.
    geoJsonWgs84: JSON.stringify(boundaryGeojson.boundaryGeometryWgs84)
  }
}
