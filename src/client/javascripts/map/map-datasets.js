export const FILL_LAYER_IDS = ['edp_boundaries', 'excluded_areas']
export const ALL_LAYER_IDS = FILL_LAYER_IDS.flatMap((id) => [
  id,
  `${id}-stroke`
])

export function createMapDatasetsPlugin() {
  return window.defra.datasetsPlugin({
    datasets: [
      {
        id: 'edp_boundaries',
        label: 'Nature Restoration Fund nutrients levy',
        tiles: ['/impact-assessor-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt'],
        sourceLayer: 'edp_boundaries',
        showInKey: true,
        style: {
          stroke: '#FD0',
          fillPattern: 'horizontal-hatch',
          fillPatternForegroundColor: 'rgba(255, 221, 0, 0.6)',
          fillPatternBackgroundColor: 'transparent'
        }
      },
      {
        id: 'excluded_areas',
        label: 'Excluded areas',
        tiles: ['/excluded-areas-map/tiles/edp_boundaries/{z}/{x}/{y}.mvt'],
        sourceLayer: 'edp_boundaries',
        showInKey: true,
        style: {
          stroke: '#f47738',
          fillPattern: 'vertical-hatch',
          fillPatternForegroundColor: 'rgba(244, 119, 56, 0.6)',
          fillPatternBackgroundColor: 'transparent'
        }
      }
    ]
  })
}
