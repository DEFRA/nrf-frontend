export const routeId = 'confirmation'

// Leaf module: pages redirecting here import the path without pulling in
// route registration (a circular import for any controller their routes
// use). Must stay import-free.
export const routePath = `/quote/${routeId}`
