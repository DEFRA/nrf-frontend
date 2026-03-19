/**
 * Geometry helpers for the boundary map.
 */

export function collectCoords(c, coords) {
  if (typeof c[0] === 'number') {
    coords.push(c)
  } else {
    c.forEach(function (inner) {
      collectCoords(inner, coords)
    })
  }
}

export function fitMapToBounds(mapInstance, geojson) {
  const coords = []
  ;(geojson.features || [geojson]).forEach(function (f) {
    collectCoords(f.geometry ? f.geometry.coordinates : f.coordinates, coords)
  })

  if (coords.length) {
    let west = coords[0][0]
    let south = coords[0][1]
    let east = coords[0][0]
    let north = coords[0][1]
    coords.forEach(function (c) {
      if (c[0] < west) {
        west = c[0]
      }
      if (c[0] > east) {
        east = c[0]
      }
      if (c[1] < south) {
        south = c[1]
      }
      if (c[1] > north) {
        north = c[1]
      }
    })
    mapInstance.fitBounds(
      [
        [west, south],
        [east, north]
      ],
      { padding: 40 }
    )
  }
}
