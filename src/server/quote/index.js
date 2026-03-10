import routesStart from './start/routes.js'
import routesBoundaryType from './boundary-type/routes.js'
import routesResidential from './residential/routes.js'
import routesNoEdp from './no-edp/routes.js'
import routesDevelopmentType from './development-types/routes.js'
import routesEmail from './email/routes.js'
import routesUploadBoundary from './upload-boundary/routes.js'
import routesUploadReceived from './upload-received/routes.js'
import routesCheckYourAnswers from './check-your-answers/routes.js'

/**
 * @openapi
 * /quote/next:
 *   get:
 *     tags:
 *       - Quote
 *     summary: Placeholder page
 *     description: Placeholder for pages not yet implemented
 *     responses:
 *       200:
 *         description: HTML placeholder page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
// Placeholder route for pages not yet implemented
const placeholderRoute = {
  method: 'GET',
  path: '/quote/next',
  handler: () => '<h1>Placeholder</h1><p>This page is not yet implemented.</p>'
}

export const quote = {
  plugin: {
    name: 'quote',
    register(server) {
      server.route([
        ...routesStart,
        ...routesBoundaryType,
        ...routesResidential,
        ...routesNoEdp,
        ...routesDevelopmentType,
        ...routesEmail,
        ...routesUploadBoundary,
        ...routesUploadReceived,
        ...routesCheckYourAnswers,
        placeholderRoute
      ])
    }
  }
}
