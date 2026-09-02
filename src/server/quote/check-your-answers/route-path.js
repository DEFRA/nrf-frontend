const routeId = 'check-your-answers'

// Leaf module: shared form controllers import this path so that returning to
// the summary after a change does not pull route registration into a circular
// import (their routes import back into the shared controllers). Must stay
// import-free.
export const routePath = `/quote/${routeId}`
