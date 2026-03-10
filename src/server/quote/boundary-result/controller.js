import { getPageTitle } from '../../common/helpers/page-title.js'

export function handler(request, h) {
  const boundaryCheckJob = request.yar.get('boundaryCheckJob')
  if (!boundaryCheckJob) {
    return h.redirect('/quote/upload-boundary')
  }

  const viewModel = {
    pageTitle: getPageTitle('Boundary check result'),
    pageHeading: 'Boundary check result',
    backLinkPath: '/quote/upload-received',
    jobId: boundaryCheckJob.jobId,
    status: boundaryCheckJob.status,
    pollUrl: boundaryCheckJob.pollUrl
  }

  return h.view('quote/boundary-result/index', viewModel)
}
