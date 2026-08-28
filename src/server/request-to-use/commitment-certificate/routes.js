import { requestToUseController } from '../controller-get.js'
import getViewModel from './get-view-model.js'

const routeId = 'commitment-certificate'
export const routeCommitmentCertificate =
  '/request-to-use/commitment-certificate'

export default [
  {
    method: 'GET',
    path: routeCommitmentCertificate,
    ...requestToUseController({ routeId, getViewModel })
  }
]
