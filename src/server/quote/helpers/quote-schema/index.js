import joi from 'joi'
import boundaryTypeValidation from '../../boundary-type/form-validation.js'
import developmentTypesValidation from '../../development-types/form-validation.js'
import residentialValidation from '../../residential/form-validation.js'
import emailValidation from '../../email/form-validation.js'
import peopleCountValidation from '../../people-count/form-validation.js'

const boundaryEntryType = boundaryTypeValidation().extract('boundaryEntryType')
const boundaryGeojson = joi.object().required()
// Filename of the uploaded red-line boundary file — for zip uploads this is
// the inner .shp filename chosen by the backend, for standalone uploads it's
// the uploaded filename. Absent for drawn boundaries.
const boundaryFilename = joi.string().max(255)
const developmentTypes =
  developmentTypesValidation().extract('developmentTypes')
const whenDevelopmentType = (type, thenSchema) =>
  joi.when('developmentTypes', {
    is: joi.array().has(joi.valid(type)).required(),
    then: thenSchema,
    otherwise: joi.any().strip()
  })

const whenDevelopmentTypeOptional = (type, thenSchema) =>
  joi.when('developmentTypes', {
    is: joi.array().required(),
    then: whenDevelopmentType(type, thenSchema),
    otherwise: joi.when('developmentTypes', {
      is: joi.exist(),
      then: joi.any().strip(),
      otherwise: joi.any()
    })
  })

const residentialBuildingCountSchema = residentialValidation().extract(
  'residentialBuildingCount'
)
const residentialBuildingCount = whenDevelopmentType(
  'housing',
  residentialBuildingCountSchema
)
const residentialBuildingCountOptional = whenDevelopmentTypeOptional(
  'housing',
  residentialBuildingCountSchema.optional()
)

const peopleCountSchema = peopleCountValidation().extract('peopleCount')
const peopleCount = whenDevelopmentType('other-residential', peopleCountSchema)
const peopleCountOptional = whenDevelopmentTypeOptional(
  'other-residential',
  peopleCountSchema.optional()
)
const wasteWaterTreatmentWorksId = joi.string().allow(null).required()
const wasteWaterTreatmentWorksName = joi.string().allow(null).required()
const email = emailValidation().extract('email')

export const inProgressQuoteDataSchema = joi.object({
  boundaryEntryType,
  boundaryGeojson: boundaryGeojson.optional().allow(null),
  boundaryFilename: boundaryFilename.optional().allow(null),
  developmentTypes: developmentTypes.optional().allow(null),
  residentialBuildingCount: residentialBuildingCountOptional,
  peopleCount: peopleCountOptional,
  wasteWaterTreatmentWorksId: joi.string().optional().allow(null),
  wasteWaterTreatmentWorksName: joi.string().optional().allow(null),
  email: email.optional().allow(null)
})

export const completeQuoteDataSchema = joi.object({
  boundaryEntryType,
  boundaryGeojson,
  // Optional: drawn boundaries don't have a filename.
  boundaryFilename: boundaryFilename.optional().allow(null),
  developmentTypes,
  residentialBuildingCount,
  peopleCount,
  wasteWaterTreatmentWorksId,
  wasteWaterTreatmentWorksName,
  email
})
