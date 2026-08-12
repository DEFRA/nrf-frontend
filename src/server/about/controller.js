import { routePath as startPath } from '../manage/start-page/routes.js'

/**
 * A GDS styled example about page controller.
 * Provided as an example, remove or modify as required.
 */
export const aboutController = {
  handler(_request, h) {
    return h.view('about/index', {
      pageTitle: 'About',
      heading: 'About',
      breadcrumbs: [
        {
          text: 'Home',
          href: startPath
        },
        {
          text: 'About'
        }
      ]
    })
  }
}
