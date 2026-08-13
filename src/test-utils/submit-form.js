import { JSDOM } from 'jsdom'

export const submitForm = async ({ requestUrl, server, formData, cookie }) => {
  const response = await server.inject({
    method: 'POST',
    url: requestUrl,
    payload: formData,
    headers: cookie ? { cookie } : {}
  })
  const { document } = new JSDOM(response.result).window

  const jar = new Map(
    (cookie ?? '')
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const [name, ...rest] = c.split('=')
        return [name, rest.join('=')]
      })
  )

  const setCookie = response.headers['set-cookie']
  for (const c of [].concat(setCookie ?? [])) {
    const [name, value] = c.split(';')[0].split('=')
    jar.set(name, value)
  }

  const responseCookie = jar.size
    ? [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
    : null

  return { response, document, cookie: responseCookie }
}
