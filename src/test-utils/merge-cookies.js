export function mergeCookies(existingCookie, setCookieHeader) {
  const jar = new Map(
    (existingCookie ?? '')
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const [name, ...rest] = c.split('=')
        return [name, rest.join('=')]
      })
  )
  for (const c of [].concat(setCookieHeader ?? [])) {
    const [name, value] = c.split(';')[0].split('=')
    jar.set(name, value)
  }
  return jar.size
    ? [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
    : null
}
