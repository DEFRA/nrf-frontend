/**
 * @param {object} params
 * @param {import('@hapi/hapi').Server} params.server
 * @param {string} params.requestUrl
 * @param {string} [params.cookie]
 * @returns {Promise<import('@hapi/hapi').ServerInjectResponse>}
 */
export const getResponse = ({ server, requestUrl, cookie }) =>
  server.inject({
    method: 'GET',
    url: requestUrl,
    headers: cookie ? { cookie } : {}
  })
