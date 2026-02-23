import { JSDOM } from 'jsdom'

export const loadPage = async ({ requestUrl, server }) => {
  const response = await server.inject({
    method: 'GET',
    url: requestUrl
  })
  const { window } = new JSDOM(response.result)
  return window.document
}
