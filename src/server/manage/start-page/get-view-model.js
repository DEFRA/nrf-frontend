import { getPageTitle } from '../../common/helpers/page-title.js'
import { config } from '../../../config/config.js'

const serviceName = config.get('serviceName')

export default function () {
  return {
    pageTitle: getPageTitle(),
    pageHeading: serviceName
  }
}
