import { readFileSync } from 'node:fs'

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

export const gitHash = getGitHash()
