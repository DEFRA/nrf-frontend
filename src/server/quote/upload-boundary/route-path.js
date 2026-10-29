const routeId = 'upload-boundary'

// Leaf module: checking-file imports this path as a factory default, and
// upload-boundary imports checking-file's path back, so importing it must not
// pull route registration into that circular import. Must stay import-free.
export const routePath = `/quote/${routeId}`
