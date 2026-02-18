import { quoteController } from './controller-get.js'
import { quotePostController } from './controller-post.js'

export const quote = {
  plugin: {
    name: 'quote',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/quote/{slug}',
          ...quoteController,
          options: {
            auth: false
          }
        },
        {
          method: 'POST',
          path: '/quote/{slug}',
          ...quotePostController,
          options: {
            auth: false
          }
        }
      ])
    }
  }
}
