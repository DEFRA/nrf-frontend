import joi from 'joi'
import boundaryTypeValidation from '../../boundary-type/form-validation.js'
import developmentTypesValidation from '../../development-types/form-validation.js'
import residentialValidation from '../../residential/form-validation.js'
import emailValidation from '../../email/form-validation.js'
import peopleCountValidation from '../../people-count/form-validation.js'

const boundaryEntryType = boundaryTypeValidation().extract('boundaryEntryType')
const boundaryGeojson = joi.object().required()
const developmentTypes =
  developmentTypesValidation().extract('developmentTypes')
const residentialBuildingCount = joi.when('developmentTypes', {
  is: joi.array().has(joi.valid('housing')),
  then: residentialValidation().extract('residentialBuildingCount'),
  otherwise: joi.any().strip()
})
const peopleCount = joi.when('developmentTypes', {
  is: joi.array().has(joi.valid('other-residential')),
  then: peopleCountValidation().extract('peopleCount'),
  otherwise: joi.any().strip()
})
const wasteWaterTreatmentWorksId = joi.string().allow(null).required()
const wasteWaterTreatmentWorksName = joi.string().allow(null).required()
const email = emailValidation().extract('email')

export const inProgressQuoteDataSchema = joi.object({
  boundaryEntryType,
  boundaryGeojson,
  developmentTypes: developmentTypes.allow(null),
  residentialBuildingCount,
  peopleCount,
  wasteWaterTreatmentWorksId,
  wasteWaterTreatmentWorksName,
  email
})

export const completeQuoteDataSchema = joi.object({
  boundaryEntryType,
  boundaryGeojson,
  developmentTypes,
  residentialBuildingCount,
  peopleCount,
  wasteWaterTreatmentWorksId,
  wasteWaterTreatmentWorksName,
  email
})
