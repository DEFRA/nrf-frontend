import joi from 'joi'
import { referenceParam, tokenParam } from '@defra/nrf-library'
import { createSessionNamespace } from '../../../common/helpers/session-namespace/index.js'

// The spent magic link's reference and token, kept so the link expired page can
// exchange them for a new link without putting the token in a URL or form.
export const expiredLinkSession = createSessionNamespace({
  key: 'expiredLink',
  schema: joi.object({
    reference: referenceParam.required(),
    token: tokenParam.required()
  })
})
