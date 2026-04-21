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
  ],
  boundaryMetadata: {
    area: {
      hectares: 1.2,
      acres: 3.5
    },
    perimeter: {
      kilometres: 14.15,
      miles: 9.3
    },
    centre: [1.293485, 51.203493], // lon, lat
    bounds: {
      topLeft: [1.2933945, 51.0],
      topRight: [1.438556, 52.685168],
      bottomRight: [1.2978945, 50.586567],
      bottomLeft: [1.427283, 52.678713]
    }
  }
}
