import joi from 'joi'
import planningTypeValidation from '../../planning-type/form-validation.js'
import boundaryTypeValidation from '../../boundary-type/form-validation.js'
import confirmHousingValidation from '../../confirm-housing/form-validation.js'
import residentialValidation from '../../units/form-validation.js'
import emailValidation from '../../email/form-validation.js'

// Matches the VARCHAR(255) width of the quotes.boundary_filename column in
// the backend database (see db.changelog-1.8.xml).
const MAX_BOUNDARY_FILENAME_LENGTH = 255

const planningType = planningTypeValidation().extract('planningType')
const boundaryEntryType = boundaryTypeValidation().extract('boundaryEntryType')
const isHousing = confirmHousingValidation().extract('isHousing')
const boundaryGeojson = joi.object().required()
// Filename of the uploaded red-line boundary file — for zip uploads this is
// the inner .shp filename chosen by the backend, for standalone uploads it's
// the uploaded filename. Absent for drawn boundaries.
const boundaryFilename = joi.string().max(MAX_BOUNDARY_FILENAME_LENGTH)
const residentialBuildingCountSchema = residentialValidation().extract(
  'residentialBuildingCount'
)
const email = emailValidation().extract('email')

export const inProgressQuoteDataSchema = joi.object({
  planningType: planningType.optional().allow(null),
  isHousing: isHousing.optional().allow(null),
  boundaryEntryType: boundaryEntryType.optional().allow(null),
  boundaryGeojson: boundaryGeojson.optional().allow(null),
  boundaryFilename: boundaryFilename.optional().allow(null),
  residentialBuildingCount: residentialBuildingCountSchema
    .optional()
    .allow(null),
  email: email.optional().allow(null),
  disableAnalyticsAudit: joi.boolean().optional()
})

export const completeQuoteDataSchema = joi.object({
  planningType,
  isHousing,
  boundaryEntryType,
  boundaryGeojson,
  // Optional: drawn boundaries don't have a filename.
  boundaryFilename: boundaryFilename.optional().allow(null),
  residentialBuildingCount: residentialBuildingCountSchema,
  email,
  disableAnalyticsAudit: joi.boolean().optional()
})
