import createMapStylesPlugin from '@defra/interactive-map/plugins/map-styles'
import createScaleBarPlugin from '@defra/interactive-map/plugins/scale-bar'
import { getMapStyles } from './styles.js'
import { createMapDatasetsPlugin } from './datasets.js'

export function createCommonMapPlugins() {
  const mapStyles = getMapStyles()
  const datasetsPlugin = createMapDatasetsPlugin()
  const mapStylesPlugin = createMapStylesPlugin({ mapStyles })
  const scaleBarPlugin = createScaleBarPlugin({ units: 'metric' })

  return { mapStyles, datasetsPlugin, mapStylesPlugin, scaleBarPlugin }
}
