const routeId = 'boundary-type'

// Leaf module: other pages and shared controllers import this path without
// pulling in route registration (circular import). Must stay import-free.
export const routePath = `/quote/${routeId}`
