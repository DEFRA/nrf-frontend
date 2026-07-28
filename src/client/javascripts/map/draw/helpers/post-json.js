import { logger } from '../../../logger/index.js'

/**
 * @param {string} url
 * @param {object} body
 * @param {{ csrfToken: string, parseJson?: boolean }} params
 * @returns {Promise<{ response: Response, payload: object|null }>}
 */
export async function postJson(url, body, { csrfToken, parseJson = true }) {
  const headers = { 'Content-Type': 'application/json' }
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken
  }

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
  } catch (error) {
    logger.error(error, `Failed to POST to ${url}`)
    throw error
  }

  if (!response.ok) {
    logger.error(
      new Error(`Received status ${response.status}`),
      `POST to ${url} returned a non-OK response`
    )
  }

  if (!parseJson) {
    return { response, payload: null }
  }

  let payload = null
  try {
    payload = await response.json()
  } catch (error) {
    logger.error(error, 'Failed to parse JSON response')
  }

  return { response, payload }
}
