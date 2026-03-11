import { JSDOM } from 'jsdom'

export const submitForm = async ({ requestUrl, server, formData, cookie }) => {
  const response = await server.inject({
    method: 'POST',
    url: requestUrl,
    payload: formData,
    headers: cookie ? { cookie } : {}
  })
  const { document } = new JSDOM(response.result).window
  const setCookie = response.headers['set-cookie']
  const responseCookie = setCookie
    ? []
        .concat(setCookie)
        .map((c) => c.split(';')[0])
        .join('; ')
    : null
  return { response, document, cookie: responseCookie }
}
