import { MAX_BOUNDARY_FILE_SIZE_MB } from '@defra/nrf-library'

// The accepted file formats, shared between the upload hint and the
// unsupported-file-type error message so the list can't drift out of sync
// when a format is added or removed.
export const BOUNDARY_UPLOAD_FORMATS_TEXT =
  'a GeoJSON file (.geojson or .json), keyhole markup language file (.kml) or a shapefile (.shp). Shapefiles (.shp) must be .zip files and must contain at least the .shp, .shx, .dbf and .prj files.'

// Shown on both the boundary-type "Upload a file" radio option and the
// upload-boundary page itself.
export const BOUNDARY_UPLOAD_HINT_TEXT = `Upload ${BOUNDARY_UPLOAD_FORMATS_TEXT} The file must be smaller than ${MAX_BOUNDARY_FILE_SIZE_MB}MB.`
