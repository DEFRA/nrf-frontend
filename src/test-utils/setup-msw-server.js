import { beforeAll, afterEach, afterAll } from 'vitest'
import { http, passthrough } from 'msw'
import { setupServer } from 'msw/node'

const baseHandlers = [http.get('http://localhost:3200/*', () => passthrough())]

export const setupMswServer = (...handlers) => {
  const server = setupServer(...baseHandlers, ...handlers)

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  return server
}
