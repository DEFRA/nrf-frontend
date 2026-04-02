export const boundaryGeojson = {
  boundaryGeometryWgs84: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0]
            ]
          ]
        },
        properties: {}
      }
    ]
  },
  intersectingEdps: []
}

export const boundaryGeojsonWithEdp = {
  boundaryGeometryWgs84: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0]
            ]
          ]
        },
        properties: {}
      }
    ]
  },
  intersectingEdps: [
    { label: 'Kent Downs EDP', n2k_site_name: 'North Downs Woodlands' }
  ]
}
