// England plus a margin, so a boundary on the coast or the Welsh or Scottish
// border can still be seen in context. Shared by the browser maps, which are
// held within it, and the server, which only computes the sea mask inside it.
const ENGLAND_WEST_LONGITUDE = -7.5
const ENGLAND_SOUTH_LATITUDE = 49.5
const ENGLAND_EAST_LONGITUDE = 2.5
const ENGLAND_NORTH_LATITUDE = 56.2

export const ENGLAND_MAX_BOUNDS = [
  ENGLAND_WEST_LONGITUDE,
  ENGLAND_SOUTH_LATITUDE,
  ENGLAND_EAST_LONGITUDE,
  ENGLAND_NORTH_LATITUDE
]
