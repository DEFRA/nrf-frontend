import { BOUNDARY_ERRORS, MAX_BOUNDARY_FILE_SIZE_MB } from '@defra/nrf-library'
import { BOUNDARY_UPLOAD_FORMATS_TEXT } from './boundary-upload-hint.js'

const { UPLOAD, GEOMETRY, SERVICE } = BOUNDARY_ERRORS

// User-facing copy for each boundary-check failure code.
export const BOUNDARY_ERROR_MESSAGES = {
  [UPLOAD.FILE_SIZE_TOO_LARGE]: `The selected file must be smaller than ${MAX_BOUNDARY_FILE_SIZE_MB}MB.`,
  [UPLOAD.ZIP_ENTRY_TOO_LARGE]:
    'A file in the ZIP file is larger than the 20 MB limit. Reduce the file size, then upload it again.',
  [UPLOAD.ZIP_TOTAL_TOO_LARGE]:
    'The contents of the ZIP file are too large when extracted. Reduce the file size, then upload it again.',
  [UPLOAD.UPLOAD_NOT_READY]:
    'The file upload has not finished processing. Please try again.',
  [UPLOAD.UPLOAD_FILE_MISSING]: 'Select a red line boundary file',
  [UPLOAD.UPLOAD_STATUS_CHECK_FAILED]:
    'Unable to check the upload status. Please try again.',
  [UPLOAD.S3_DOWNLOAD_FAILED]:
    'Unable to retrieve the uploaded file. Please try again.',
  [UPLOAD.UNSAFE_FILENAME]:
    'A file name contains characters that are not allowed. Use only letters, numbers, spaces, full stops, underscores (_), hyphens (-) and brackets (), then upload the ZIP file again.',
  [UPLOAD.INVALID_ZIP]:
    'The uploaded file could not be opened as a ZIP file. Check the file and upload it again.',
  [UPLOAD.ZIP_TOO_MANY_FILES]:
    'The ZIP file contains too many files. Remove any files you do not need, then upload it again.',
  [UPLOAD.ZIP_NESTED_ZIP]:
    'The ZIP file contains another ZIP file. Remove the ZIP file inside it, then upload it again.',
  [UPLOAD.ZIP_UNSAFE_PATH]:
    'The ZIP file contains an invalid file or folder path. Check the ZIP file and upload it again.',
  [UPLOAD.ZIP_MISSING_SHAPEFILE]:
    'The ZIP file does not contain a shapefile (.shp). Upload a ZIP file containing a shapefile.',
  [UPLOAD.ZIP_MISSING_SHAPEFILE_PARTS]:
    'The shapefile is incomplete. Make sure the ZIP file contains all the required files, then upload it again.',
  [UPLOAD.BOUNDARY_FILE_NOT_FOUND_IN_ZIP]:
    'The required file could not be found in the ZIP file. Check the ZIP file and upload it again.',
  [UPLOAD.ZIP_AMBIGUOUS_FILENAME]:
    'The ZIP file contains more than one file with the same name. Rename one of the files, then upload the ZIP file again.',
  [UPLOAD.UNSUPPORTED_FILE_TYPE]: `The selected file must be ${BOUNDARY_UPLOAD_FORMATS_TEXT}`,
  [UPLOAD.UNREADABLE_GEOMETRY_FILE]:
    'The file could not be read. Check the file and upload it again.',
  [UPLOAD.FILE_CONTAINS_VIRUS]: 'The selected file contains a virus',
  [UPLOAD.FILE_REJECTED_BY_UPLOADER]:
    'The uploaded file was rejected. Please check the file and try again.',
  [UPLOAD.UNSUPPORTED_CRS]:
    'The uploaded boundary file is using co-ordinates that are not recognised.',
  [UPLOAD.MISSING_CRS]:
    'The uploaded boundary file is using co-ordinates that are not recognised.',
  [GEOMETRY.INVALID_GEOMETRY]:
    'The file contains a red line boundary with no shape.',
  [GEOMETRY.UNSUPPORTED_GEOMETRY_TYPE]:
    'The file must contain an area, not a point or a line.',
  [GEOMETRY.SELF_INTERSECTING]: 'The red line boundary is overlapping itself.',
  [GEOMETRY.HAS_HOLES]:
    'The red line boundary contains a hole. Upload a boundary with no holes.',
  [GEOMETRY.DUPLICATE_VERTICES]:
    'The red line boundary contains the same point more than once. Remove the duplicate point.',
  [GEOMETRY.UNCLOSED_RING]:
    'The red line boundary is not closed. Make sure the boundary joins back to its starting point.',
  [GEOMETRY.NO_POLYGON_FOUND]: 'The red line boundary is missing.',
  [GEOMETRY.COORDINATES_OUT_OF_RANGE]:
    'The red line boundary contains coordinates outside the supported area.',
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
