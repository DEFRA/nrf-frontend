import { JSDOM } from 'jsdom'

export const loadPage = async ({ requestUrl, server, cookie }) => {
  const response = await server.inject({
    method: 'GET',
    url: requestUrl,
    headers: cookie ? { cookie } : {}
  })
  const { window } = new JSDOM(response.result)
  return window.document
}
