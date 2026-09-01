import { JSDOM } from 'jsdom'
import { mergeCookies } from './merge-cookies.js'

export const submitForm = async ({ requestUrl, server, formData, cookie }) => {
  const response = await server.inject({
    method: 'POST',
    url: requestUrl,
    payload: formData,
    headers: cookie ? { cookie } : {}
  })
  const { document } = new JSDOM(response.result).window
  const responseCookie = mergeCookies(cookie, response.headers['set-cookie'])
  return { response, document, cookie: responseCookie }
}
