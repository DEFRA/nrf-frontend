const routeId = 'draw-boundary'

// Leaf module: the change alias maps this page's path to its own, so importing
// it must not pull route registration into a circular import. Must stay
// import-free.
export const routePath = `/quote/${routeId}`
