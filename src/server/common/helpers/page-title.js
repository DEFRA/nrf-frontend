import { config } from '../../../config/config.js'

const serviceName = config.get('serviceName')
const suffix = `${serviceName} - Gov.uk`

export const getPageTitle = (prefix) =>
  prefix ? `${prefix} - ${suffix}` : suffix
