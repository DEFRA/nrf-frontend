import { BOUNDARY_ERRORS, MAX_BOUNDARY_FILE_SIZE_MB } from '@defra/nrf-library'

const { UPLOAD, GEOMETRY, SERVICE } = BOUNDARY_ERRORS

// User-facing copy for each boundary-check failure code.
export const BOUNDARY_ERROR_MESSAGES = {
  [UPLOAD.FILE_SIZE_TOO_LARGE]: `The uploaded boundary file is too large. The maximum file size allowed is ${MAX_BOUNDARY_FILE_SIZE_MB}MB.`,
  [UPLOAD.ZIP_ENTRY_TOO_LARGE]:
    'A file inside the uploaded zip is too large. Please reduce the file size and try again.',
  [UPLOAD.ZIP_TOTAL_TOO_LARGE]:
    'The uploaded zip is too large once extracted. Please reduce the file size and try again.',
  [UPLOAD.UPLOAD_NOT_READY]:
    'The file upload has not finished processing. Please try again.',
  [UPLOAD.UPLOAD_FILE_MISSING]:
    'No file was found for this upload. Please try uploading the file again.',
  [UPLOAD.UPLOAD_STATUS_CHECK_FAILED]:
    'Unable to check the upload status. Please try again.',
  [UPLOAD.S3_DOWNLOAD_FAILED]:
    'Unable to retrieve the uploaded file. Please try again.',
  [UPLOAD.UNSAFE_FILENAME]:
    'The boundary filename contains unsupported characters. Use letters, numbers, spaces, dots, underscores, hyphens or parentheses, and rename the file before uploading it again.',
  [UPLOAD.INVALID_ZIP]:
    'The uploaded file is not a valid zip archive. Please check the file and try again.',
  [UPLOAD.ZIP_TOO_MANY_FILES]:
    'The uploaded zip contains too many files. Please remove any unnecessary files and try again.',
  [UPLOAD.ZIP_NESTED_ZIP]:
    'The uploaded zip contains a nested zip file. Nested zips are not allowed.',
  [UPLOAD.ZIP_UNSAFE_PATH]:
    'The uploaded zip contains an entry with an unsafe path. Please check the file and try again.',
  [UPLOAD.ZIP_MISSING_SHAPEFILE]:
    'The uploaded zip must contain a shapefile (.shp with .shx, .dbf and .prj companions).',
  [UPLOAD.ZIP_MISSING_SHAPEFILE_PARTS]:
    'The shapefile is missing required companion files. A shapefile zip must contain .shp, .shx, .dbf and .prj files with the same name.',
  [UPLOAD.BOUNDARY_FILE_NOT_FOUND_IN_ZIP]:
    'The selected boundary file could not be found inside the uploaded zip.',
  [UPLOAD.ZIP_AMBIGUOUS_FILENAME]:
    'The selected boundary filename appears more than once in the uploaded zip.',
  [UPLOAD.UNSUPPORTED_FILE_TYPE]:
    'This file type is not supported. Use a GeoJSON (.geojson, .json), KML (.kml), or zipped Shapefile (.zip) file.',
  [UPLOAD.UNREADABLE_GEOMETRY_FILE]:
    'The uploaded file could not be read. Please check the file and try again.',
  [UPLOAD.FILE_REJECTED_BY_UPLOADER]:
    'The uploaded file was rejected. Please check the file and try again.',
  [UPLOAD.UNSUPPORTED_CRS]:
    'The uploaded boundary file uses an unsupported coordinate reference system (CRS). Please ensure your boundary file uses British National Grid (EPSG:27700) or WGS 84 (EPSG:4326) and try again.',
  [UPLOAD.MISSING_CRS]:
    'The uploaded boundary file has no coordinate reference system (CRS) defined. Please ensure your boundary file has a Coordinate Reference System defined and try again.',
  [GEOMETRY.INVALID_GEOMETRY]:
    'The uploaded boundary geometry could not be processed. It contains incomplete or malformed coordinates.',
  [GEOMETRY.UNSUPPORTED_GEOMETRY_TYPE]:
    'Only Polygon geometry is supported. Please ensure the boundary forms a complete closed polygon shape.',
  [GEOMETRY.SELF_INTERSECTING]:
    'The uploaded boundary contains invalid geometry (self-intersecting or crossing line segments). Please correct the boundary so that edges do not cross each other and try again.',
  [GEOMETRY.HAS_HOLES]:
    'The uploaded boundary contains interior holes or gaps. The boundary must be a single continuous area without holes.',
  [GEOMETRY.DUPLICATE_VERTICES]:
    'The uploaded boundary contains duplicated or overlapping geometry (duplicate consecutive vertices). Please clean up the boundary and try again.',
  [GEOMETRY.NO_POLYGON_FOUND]:
    'No polygon geometry was found in the uploaded file.',
  [SERVICE.IMPACT_ASSESSOR_UNREACHABLE]:
    'Unable to check the boundary right now. Please try again.',
  [SERVICE.IMPACT_ASSESSOR_BAD_RESPONSE]:
    'Unable to check the boundary right now. Please try again.',
  [SERVICE.CHECK_FAILED]: 'Unable to check the boundary. Please try again.'
}

/**
 * Resolve the user-facing message for a boundary-check failure code.
 * Falls back to a generic message for unrecognised codes, so a wording
 * change or new failure mode upstream never leaves the page blank.
 * @param {string} code
 * @returns {string}
 */
export function getBoundaryErrorMessage(code) {
  return (
    BOUNDARY_ERROR_MESSAGES[code] ??
    BOUNDARY_ERROR_MESSAGES[SERVICE.CHECK_FAILED]
  )
}
