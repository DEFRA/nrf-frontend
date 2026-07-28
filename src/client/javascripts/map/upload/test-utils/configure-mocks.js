import { vi } from 'vitest'

/**
 * @param {object} mocks
 * @param {object} mapInstance
 */
export function configureMocks(mocks, mapInstance) {
  const mockMap = { on: vi.fn() }

  mocks.interactiveMapConstruct.mockReturnValue(mockMap)
  mocks.maplibreProvider.mockReturnValue({ provider: 'maplibre' })
  mocks.mapStylesPlugin.mockReturnValue({ id: 'mapStyles' })
  mocks.scaleBarPlugin.mockReturnValue({ id: 'scaleBar' })
  mocks.datasetsPlugin.mockReturnValue({ id: 'datasets' })

  return {
    _mock: mocks.interactiveMapConstruct,
    mapStylesPlugin: mocks.mapStylesPlugin,
    _mockMap: mockMap,
    _triggerReady() {
      mockMap.on.mock.calls
        .filter((c) => c[0] === 'map:ready')
        .forEach((c) => c[1]({ map: mapInstance }))
    }
  }
}
