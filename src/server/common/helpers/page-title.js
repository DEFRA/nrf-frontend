import { config } from '../../../config/config.js'

const serviceName = config.get('serviceName')
const suffix = `${serviceName} - GOV.UK`

export const getPageTitle = (prefix) =>
  prefix ? `${prefix} - ${suffix}` : suffix
