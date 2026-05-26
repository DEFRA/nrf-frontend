import { JSDOM } from 'jsdom'

export const loadPage = async ({
  requestUrl,
  server,
  cookie,
  headers = {}
}) => {
  const response = await server.inject({
    method: 'GET',
    url: requestUrl,
    headers: { ...(cookie ? { cookie } : {}), ...headers }
  })
  const { window } = new JSDOM(response.result)
  return window.document
}
