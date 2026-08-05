import { vi } from 'vitest'
import { createMockInteractiveMap } from './mock-interactive-map.js'

/**
 * @param {object} mocks
 */
export function configureMocks(mocks) {
  const mockMap = createMockInteractiveMap()

  mocks.interactiveMapConstruct.mockReturnValue(mockMap)
  mocks.maplibreProvider.mockReturnValue({ provider: 'maplibre' })
  mocks.mapStylesPlugin.mockReturnValue({ id: 'mapStyles' })
  mocks.scaleBarPlugin.mockReturnValue({ id: 'scaleBar' })
  mocks.searchPlugin.mockReturnValue({ id: 'search' })
  mocks.interactPlugin.mockReturnValue({
    id: 'interact',
    enable: vi.fn(),
    disable: vi.fn(),
    clear: vi.fn(),
    selectFeature: vi.fn()
  })
  mocks.drawMLPlugin.mockReturnValue({
    newPolygon: vi.fn(),
    editFeature: vi.fn(),
    deleteFeature: vi.fn(),
    addFeature: vi.fn()
  })
  mocks.datasetsPlugin.mockReturnValue({ id: 'datasets' })

  return {
    _mock: mocks.interactiveMapConstruct,
    _mockMap: mockMap,
    drawMLPlugin: mocks.drawMLPlugin,
    _emit(eventName, ...args) {
      mockMap.on.mock.calls
        .filter((c) => c[0] === eventName)
        .forEach((c) => c[1](...args))
    }
  }
}
