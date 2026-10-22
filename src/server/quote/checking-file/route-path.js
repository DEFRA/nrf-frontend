const routeId = 'checking-file'

// Leaf module: upload-boundary imports this path as a factory default, and
// checking-file imports upload-boundary's path back, so importing it must not
// pull route registration into that circular import. Must stay import-free.
export const routePath = `/quote/${routeId}`
