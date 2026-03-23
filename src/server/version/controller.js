import { statusCodes } from '../common/constants/status-codes.js'

export const versionController = {
  handler(_request, h) {
    return h
      .response({ version: process.env.GIT_HASH ?? 'unknown' })
      .code(statusCodes.ok)
  }
}
