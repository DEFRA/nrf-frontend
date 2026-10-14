import joi from 'joi'
import { createSessionNamespace } from '../../../common/helpers/session-namespace/index.js'
import whatWouldYouLikeToDoValidation from '../../what-would-you-like-to-do/form-validation.js'

const whatWouldYouLikeToDo = whatWouldYouLikeToDoValidation().extract(
  'whatWouldYouLikeToDo'
)

export const manageSession = createSessionNamespace({
  key: 'manage',
  schema: joi.object({
    whatWouldYouLikeToDo: whatWouldYouLikeToDo.optional().allow(null)
  })
})
