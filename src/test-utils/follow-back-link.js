import { getByRole } from '@testing-library/dom'
import { loadPage } from './load-page.js'
import { getResponse } from './get-response.js'

const incompleteAnswersHeading = 'Your details are incomplete'

/**
 * Loads a page and returns where its Back link goes.
 * @param {object} params
 * @param {string} params.requestUrl
 * @param {import('@hapi/hapi').Server} params.server
 * @param {string} [params.cookie]
 * @returns {Promise<string>} the Back link's href
 */
export const followBackLink = async ({ requestUrl, server, cookie }) => {
  const document = await loadPage({ requestUrl, server, cookie })
  return getByRole(document, 'link', { name: 'Back' }).getAttribute('href')
}

/**
 * Follows a page's Back link and asserts it lands on the incomplete answers
 * error page.
 * @param {object} params
 * @param {string} params.requestUrl - the page whose Back link is followed
 * @param {import('@hapi/hapi').Server} params.server
 * @param {string} [params.cookie]
 * @returns {Promise<void>}
 */
export const expectBackToShowIncompleteAnswers = async ({
  requestUrl,
  server,
  cookie
}) => {
  const backPath = await followBackLink({ requestUrl, server, cookie })

  const response = await getResponse({ server, requestUrl: backPath, cookie })
  expect(response.statusCode).toBe(400)

  const document = await loadPage({ requestUrl: backPath, server, cookie })
  expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
    incompleteAnswersHeading
  )
}
