const routeId = 'file-preview'

// Leaf module: checking-file imports this path as a factory default, so
// importing it must not pull route registration into a circular import. Must
// stay import-free.
export const routePath = `/quote/${routeId}`
