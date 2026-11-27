import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'Your details have been submitted'

/**
 * @param {import('../controller-get.js').ViewModelInput} [input]
 * @returns {{ pageTitle: string, pageHeading: string, nrlReference: string | undefined }} view model for the your details have been submitted page
 */
export default function getViewModel({ session } = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    nrlReference: session?.requestToUse?.nrlReference
  }
}
