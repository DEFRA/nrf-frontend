import { getPageTitle } from '../../common/helpers/page-title.js'

export const pageHeading =
  'Enter the NRL reference for the original planning permission'

// The was the original planning permission committed page is not built yet
// (NRF2-1309 lists it as the previous page); swap this literal for its
// route-path.js import when it lands.
const originalCommittedPath = '/request-to-use/original-committed'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: originalCommittedPath
  }
}
