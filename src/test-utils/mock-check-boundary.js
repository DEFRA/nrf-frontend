import { checkBoundary } from '../server/common/services/boundary.js'

export function mockCheckBoundary({ geojson = null, error = null } = {}) {
  vi.mocked(checkBoundary).mockResolvedValue({ geojson, error })
}
