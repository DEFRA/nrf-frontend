import vtPbf from 'vt-pbf'

export const seaLayerName = 'sea'

const polygonFeatureType = 3
const vectorTileSpecVersion = 2

/**
 * @param {{ polygons: number[][][][], extent: number }} params
 * @returns {Buffer}
 */
export function encodeSeaTile({ polygons, extent }) {
  const features = polygons.map(function toFeature(rings, id) {
    return { id, type: polygonFeatureType, tags: {}, geometry: rings }
  })

  return Buffer.from(
    vtPbf.fromGeojsonVt(
      { [seaLayerName]: { features } },
      { version: vectorTileSpecVersion, extent }
    )
  )
}
