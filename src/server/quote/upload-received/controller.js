import { getPageTitle } from '../../common/helpers/page-title.js'

export function handler(_request, h) {
  const viewModel = {
    pageTitle: getPageTitle('File uploaded'),
    pageHeading: 'TODO: implement file upload status page'
  }

  return h
    .view('quote/upload-received/index', viewModel)
    .header('Cache-Control', 'no-store, must-revalidate')
}
