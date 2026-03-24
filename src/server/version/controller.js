import { gitHash } from '../common/helpers/git-hash.js'
import { statusCodes } from '../common/constants/status-codes.js'

export const versionController = {
  handler(_request, h) {
    return h.response({ version: gitHash }).code(statusCodes.ok)
  }
}
