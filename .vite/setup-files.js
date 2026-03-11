import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)

vi.mock('ioredis')

if (typeof HTMLCanvasElement !== 'undefined') {
  // eslint-disable-next-line no-undef
  HTMLCanvasElement.prototype.getContext = () => null
}
