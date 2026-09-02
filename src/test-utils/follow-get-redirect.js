import { mergeCookies } from './merge-cookies.js'

export async function followGetRedirect({ server, url, cookie }) {
  const response = await server.inject({
    method: 'GET',
    url,
    headers: cookie ? { cookie } : {}
  })
  return mergeCookies(cookie, response.headers['set-cookie'])
}
