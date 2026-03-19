export const validGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-1.5, 52.0],
            [-1.4, 52.0],
            [-1.4, 52.1],
            [-1.5, 52.1],
            [-1.5, 52.0]
          ]
        ]
      },
      properties: {}
    }
  ]
}

export const validEdpBoundaryGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-1.6, 51.9],
            [-1.3, 51.9],
            [-1.3, 52.2],
            [-1.6, 52.2],
            [-1.6, 51.9]
          ]
        ]
      },
      properties: { label: 'EDP 1' }
    }
  ]
}

export const validEdpIntersectionGeojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-1.5, 52.0],
            [-1.45, 52.0],
            [-1.45, 52.05],
            [-1.5, 52.05],
            [-1.5, 52.0]
          ]
        ]
      },
      properties: {
        label: 'EDP 1',
        overlap_area_ha: 0.5,
        overlap_percentage: 25.0
      }
    }
  ]
}

export const singleGeometry = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-1.5, 52.0] },
  properties: {}
}

export const multiPolygon = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-2.0, 51.0],
              [-1.0, 51.0],
              [-1.0, 53.0],
              [-2.0, 53.0],
              [-2.0, 51.0]
            ]
          ]
        ]
      },
      properties: {}
    }
  ]
}

export const emptyGeojson = { type: 'FeatureCollection', features: [] }
