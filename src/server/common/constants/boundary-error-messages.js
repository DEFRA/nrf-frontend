import { BOUNDARY_ERRORS, MAX_BOUNDARY_FILE_SIZE_MB } from '@defra/nrf-library'
import { BOUNDARY_UPLOAD_FORMATS_TEXT } from './boundary-upload-hint.js'

const { UPLOAD, GEOMETRY, SERVICE } = BOUNDARY_ERRORS

const MISSING_REQUIRED_ZIP_FILES =
  'The zipped file is missing one or more required files.'

// User-facing copy for each boundary-check failure code.
export const BOUNDARY_ERROR_MESSAGES = {
  [UPLOAD.FILE_SIZE_TOO_LARGE]: `The selected file must be smaller than ${MAX_BOUNDARY_FILE_SIZE_MB}MB.`,
  [UPLOAD.ZIP_ENTRY_TOO_LARGE]:
    'A file inside the uploaded zip is too large. Please reduce the file size and try again.',
  [UPLOAD.ZIP_TOTAL_TOO_LARGE]:
    'The uploaded zip is too large once extracted. Please reduce the file size and try again.',
  [UPLOAD.UPLOAD_NOT_READY]:
    'The file upload has not finished processing. Please try again.',
  [UPLOAD.UPLOAD_FILE_MISSING]: 'Select a red line boundary file',
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
  [UPLOAD.ZIP_MISSING_SHAPEFILE]: MISSING_REQUIRED_ZIP_FILES,
  [UPLOAD.ZIP_MISSING_SHAPEFILE_PARTS]: MISSING_REQUIRED_ZIP_FILES,
  [UPLOAD.BOUNDARY_FILE_NOT_FOUND_IN_ZIP]: MISSING_REQUIRED_ZIP_FILES,
  [UPLOAD.ZIP_AMBIGUOUS_FILENAME]:
    'The selected boundary filename appears more than once in the uploaded zip.',
  [UPLOAD.UNSUPPORTED_FILE_TYPE]: `The selected file must be ${BOUNDARY_UPLOAD_FORMATS_TEXT}`,
  [UPLOAD.UNREADABLE_GEOMETRY_FILE]:
    'The uploaded file could not be read. Please check the file and try again.',
  [UPLOAD.FILE_CONTAINS_VIRUS]: 'The selected file contains a virus',
  [UPLOAD.FILE_REJECTED_BY_UPLOADER]:
    'The uploaded file was rejected. Please check the file and try again.',
  [UPLOAD.UNSUPPORTED_CRS]:
    'The uploaded boundary file is using co-ordinates that are not recognised.',
  [UPLOAD.MISSING_CRS]:
    'The uploaded boundary file is using co-ordinates that are not recognised.',
  [GEOMETRY.INVALID_GEOMETRY]:
    'The uploaded boundary geometry could not be processed. It contains incomplete or malformed coordinates.',
  [GEOMETRY.UNSUPPORTED_GEOMETRY_TYPE]:
    'Only Polygon geometry is supported. Please ensure the boundary forms a complete closed polygon shape.',
  [GEOMETRY.SELF_INTERSECTING]: 'The red line boundary is overlapping itself.',
  [GEOMETRY.HAS_HOLES]: 'The red line boundary is not closed.',
  [GEOMETRY.DUPLICATE_VERTICES]:
    'The uploaded boundary contains duplicated or overlapping geometry (duplicate consecutive vertices). Please clean up the boundary and try again.',
  [GEOMETRY.NO_POLYGON_FOUND]: 'The red line boundary is missing.',
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
