const routeId = 'not-housing'

// Leaf module: the change-mode helper imports this path to detect dropout
// pages without pulling route registration into a circular import (their
// routes import back into the shared controllers). Must stay import-free.
export const routePath = `/quote/${routeId}`
