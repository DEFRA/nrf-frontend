import { checkBoundary } from '../server/common/services/boundary.js'

export function mockCheckBoundary({
  geojson = null,
  failureReason = null
} = {}) {
  vi.mocked(checkBoundary).mockResolvedValue({ geojson, failureReason })
}
