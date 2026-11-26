// @vitest-environment jsdom
import { setupSignedInTestServer } from '../../../test-utils/setup-signed-in-test-server.js'
import { setupSeededRequestToUseAnswers } from '../../../test-utils/setup-seeded-request-to-use-answers.js'
import { singleOrgEmployeeClaims } from '../../../test-utils/fixtures/defra-id-org-claims.js'
import { checkYourAnswersSessions } from '../../../test-utils/fixtures/check-your-answers-sessions.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { runAxeChecks } from '../../../test-utils/axe-helper.js'

const { getServer, signIn } = setupSignedInTestServer()
const { signInWithAnswers } = setupSeededRequestToUseAnswers({
  getServer,
  signIn
})

describe('Details to read before you request to use the nature restoration levy page accessibility checks', () => {
  it('should have no HTML accessibility issues', async () => {
    const cookie = await signInWithAnswers({
      claims: singleOrgEmployeeClaims,
      session: checkYourAnswersSessions.employee
    })

    const document = await loadPage({
      requestUrl: '/request-to-use/read-this',
      server: getServer(),
      cookie
    })
    await runAxeChecks(document.documentElement)
  })
})
