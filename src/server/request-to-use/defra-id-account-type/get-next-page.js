import { routeDefraIdIndividualName } from '../defra-id-individual-name/routes.js'
import { routeDefraIdBusinessRegistered } from '../defra-id-business-registered/routes.js'

export default function getNextPage({ accountType }) {
  return accountType === 'Individual'
    ? routeDefraIdIndividualName
    : routeDefraIdBusinessRegistered
}
