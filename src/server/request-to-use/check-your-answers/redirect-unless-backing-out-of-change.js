import { isChangeMode } from '../../quote/helpers/change-mode/index.js'
import { redirectWhenAnswersIncomplete } from '../helpers/redirect-when-answers-incomplete/index.js'
import { requireCompleteAnswers } from './require-complete-answers.js'

/**
 * A direct load with an earlier answer missing goes back to the review and
 * amend page. A change page's back link carries the change flag, because the
 * user is backing out of an edit made from this page: the incomplete answers
 * error page is kept for them.
 * @type {import('@hapi/hapi').Lifecycle.Method}
 */
export const redirectUnlessBackingOutOfChange = (request, h) =>
  isChangeMode(request.query)
    ? requireCompleteAnswers(request, h)
    : redirectWhenAnswersIncomplete(request, h)
