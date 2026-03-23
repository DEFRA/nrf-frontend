import { readFileSync } from 'node:fs'

import { statusCodes } from '../common/constants/status-codes.js'

function getGitHash() {
  if (process.env.GIT_HASH) {
    return process.env.GIT_HASH
  }
  try {
    return readFileSync('.git-hash', 'utf-8').trim()
  } catch {
    return 'unknown'
  }
}

const gitHash = getGitHash()

export const versionController = {
  handler(_request, h) {
    return h.response({ version: gitHash }).code(statusCodes.ok)
  }
}
