import {
  rlbUploadController,
  rlbUploadInitiateController,
  rlbUploadStatusController,
  rlbUploadStatusPollController,
  rlbUploadCallbackController
} from './controller.js'

/**
 * Sets up the routes used in the /rlb-upload page.
 * These routes are registered in src/server/router.js.
 */
export const rlbUpload = {
  plugin: {
    name: 'rlb-upload',
    register(server) {
      server.route([
        // GET /rlb-upload - Renders the upload form page
        {
          method: 'GET',
          path: '/rlb-upload',
          ...rlbUploadController,
          options: {
            ...rlbUploadController.options,
            auth: false
          }
        },
        // POST /rlb-upload/initiate - API endpoint to initiate upload
        // Returns JSON with uploadUrl
        {
          method: 'POST',
          path: '/rlb-upload/initiate',
          ...rlbUploadInitiateController,
          options: {
            ...rlbUploadInitiateController.options,
            auth: false
          }
        },
        // GET /rlb-upload/status - Shows upload status page
        {
          method: 'GET',
          path: '/rlb-upload/status',
          ...rlbUploadStatusController,
          options: {
            ...rlbUploadStatusController.options,
            auth: false
          }
        },
        // GET /rlb-upload/status/poll - API endpoint for polling status
        // Returns JSON status for AJAX polling
        {
          method: 'GET',
          path: '/rlb-upload/status/poll',
          ...rlbUploadStatusPollController,
          options: {
            ...rlbUploadStatusPollController.options,
            auth: false
          }
        },
        // POST /rlb-upload/callback - Callback from cdp-uploader
        // Called by cdp-uploader when virus scan completes
        {
          method: 'POST',
          path: '/rlb-upload/callback',
          ...rlbUploadCallbackController,
          options: {
            ...rlbUploadCallbackController.options,
            auth: false
          }
        }
      ])
    }
  }
}
