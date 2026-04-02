import joi from 'joi'
import boundaryTypeValidation from '../../boundary-type/form-validation.js'
import developmentTypesValidation from '../../development-types/form-validation.js'
import residentialValidation from '../../residential/form-validation.js'
import emailValidation from '../../email/form-validation.js'
import peopleCountValidation from '../../people-count/form-validation.js'
export const completeQuoteDataSchema = joi.object({
  boundaryEntryType: boundaryTypeValidation().extract('boundaryEntryType'),
  boundaryGeojson: joi.object().required(),
  developmentTypes: developmentTypesValidation()
    .extract('developmentTypes')
    .allow(null),
  residentialBuildingCount: joi.when('developmentTypes', {
    is: joi.array().has(joi.valid('housing')),
    then: residentialValidation().extract('residentialBuildingCount'),
    otherwise: joi.any().strip()
  }),
  peopleCount: joi.when('developmentTypes', {
    is: joi.array().has(joi.valid('other-residential')),
    then: peopleCountValidation().extract('peopleCount'),
    otherwise: joi.any().strip()
  }),
  wasteWaterTreatmentWorksId: joi.string().allow(null).required(),
  wasteWaterTreatmentWorksName: joi.string().allow(null).required(),
  email: emailValidation().extract('email')
})
