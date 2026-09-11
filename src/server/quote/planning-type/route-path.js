const routeId = 'planning-type'

// Leaf module: cross-page imports (dropout view models, shared controllers,
// tests) read the path from here so they don't pull in route registration and
// its circular imports. Must stay import-free.
export const routePath = `/quote/${routeId}`
