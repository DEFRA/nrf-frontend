import Boom from '@hapi/boom'

/**
 * failAction that shows the page not found page.
 * @type {import('@hapi/hapi').Lifecycle.FailAction}
 */
export const respondNotFound = () => {
  throw Boom.notFound()
}
