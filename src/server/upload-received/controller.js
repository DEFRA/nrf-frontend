import { getPageTitle } from '../common/helpers/page-title.js'

export function handler(request, h) {
  const viewModel = {
    pageTitle: getPageTitle('File uploaded'),
    pageHeading: 'File uploaded successfully'
  }

  return h
    .view('upload-received/index', viewModel)
    .header('Cache-Control', 'no-store, must-revalidate')
}
