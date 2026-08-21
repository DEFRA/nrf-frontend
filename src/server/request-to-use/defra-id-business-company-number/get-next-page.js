import { routeDefraIdEnterCompanyNumber } from '../defra-id-enter-company-number/routes.js'

export default function getNextPage({ isCompaniesHouseRegistered }) {
  return isCompaniesHouseRegistered === 'yes'
    ? routeDefraIdEnterCompanyNumber
    : '#'
}
