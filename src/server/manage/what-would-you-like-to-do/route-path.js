const routeId = 'what-would-you-like-to-do'

// Leaf module: other pages import this path to avoid circular imports through
// routes.js. Must stay import-free.
export const routePath = `/manage/${routeId}`
