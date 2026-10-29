import { createLogger } from '../../../common/helpers/logging/logger.js'

const logger = createLogger()

/**
 * Resolves a boundary page's back link from the saved boundary entry type:
 * the page the boundary came from (draw or upload), falling back to the
 * boundary type question when the entry type is not recognised.
 * @param {object} params
 * @param {string} [params.boundaryEntryType] - the saved boundary entry type
 * @param {string} params.drawBoundaryPath - the draw boundary page's path
 * @param {string} params.uploadBoundaryPath - the upload boundary page's path
 * @param {string} params.fallbackPath - where an unrecognised entry type
 *   links back to (the boundary type question)
 * @returns {string} the back link path
 */
export const resolveBoundaryStepBackLink = ({
  boundaryEntryType,
  drawBoundaryPath,
  uploadBoundaryPath,
  fallbackPath
}) => {
  /**
   * TODO: store the list of possible boundary entry types in a single location and import it here, rather than hardcoding the values in this function.
   */
  if (boundaryEntryType === 'draw') {
    return drawBoundaryPath
  }
  if (boundaryEntryType === 'upload') {
    return uploadBoundaryPath
  }

  logger.error({ boundaryEntryType }, 'boundaryEntryType is not recognised')
  return fallbackPath
}
