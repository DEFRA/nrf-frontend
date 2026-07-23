import { MAX_BOUNDARY_FILE_SIZE_MB } from '@defra/nrf-library'

// Shared copy for the accepted file formats hint, shown on both the
// boundary-type "Upload a file" radio option and the upload-boundary page
// itself — kept as a single constant so the two can't drift out of sync.
export const BOUNDARY_UPLOAD_HINT_TEXT = `Upload a GeoJSON file (.geojson or .json), Keyhole markup language file (.kml) or a shapefile (.shp). Shapefiles (.shp) must be .zip files and must contain at least the .shp, .shx, .dbf and .prj files. The file must be smaller than ${MAX_BOUNDARY_FILE_SIZE_MB}MB.`
