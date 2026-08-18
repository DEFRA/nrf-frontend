# Authentication (DEFRA Identity)

> **AI agents / developers:** read this before changing anything under `src/server/auth/`,
> `src/server/plugins/defra-identity.js`, or session handling. It reflects the real code.

Defra ID auth is OAuth 2.0 / OpenID Connect (Authorization Code flow) built **manually** on
top of `@hapi/bell` and `@hapi/yar`. Bell is registered as a strategy but the sign-in redirect
and code-for-token exchange are hand-rolled in the controller (to inject `serviceId` and avoid
Bell's automatic redirect). Sessions are server-side; the browser only holds an opaque session id.

## Key files

| File                                       | Responsibility                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `src/server/auth/controller.js`            | All 5 route handlers: login page, sign-in redirect, callback, sign-out, sign-out-oidc                                    |
| `src/server/auth/index.js`                 | Registers auth routes (only if `server.app.authEnabled`)                                                                 |
| `src/server/plugins/defra-identity.js`     | Registers `defra-id` (Bell) + `defra-session` (custom yar scheme); token validity + refresh logic; `createUserSession()` |
| `src/server/auth/refresh-tokens.js`        | OAuth `refresh_token` grant call                                                                                         |
| `src/server/auth/get-oidc-config.js`       | Fetches OIDC discovery doc from `defraId.wellKnownUrl`                                                                   |
| `src/server/auth/get-safe-redirect.js`     | Prevents open-redirect on post-login return                                                                              |
| `src/server/common/helpers/session-cache/` | Yar server-side cache (Redis prod / memory local)                                                                        |
| `src/config/config.js`                     | `defraId.*` and `session.*` config                                                                                       |

## Auth strategies & route protection

Registered in `defra-identity.js`:

- **`defra-id`** — Bell OAuth strategy (registered, but the flow is driven manually).
- **`defra-session`** — custom `yar-session` scheme: reads `sessionId` from Yar, loads the
  session from cache, refreshes the token if expired, else returns `unauthenticated`.

There is **no server-wide default strategy**. Each route opts in explicitly:
`auth: 'defra-session'` (protected) or `auth: false` (public). If Bell/OIDC registration fails
at boot, `server.app.authEnabled` stays `false`, only `/login` is registered, and routes fall
back to `auth: false` (see `profile/index.js`).

## Routes

| Route                     | Auth            | Purpose                                                                    |
| ------------------------- | --------------- | -------------------------------------------------------------------------- |
| `GET /login`              | `false`         | Render sign-in page (`auth/login.njk`)                                     |
| `GET /auth/sign-in`       | `false`         | Build authorization URL, store CSRF `state` in Yar, 302 to Defra ID        |
| `GET /login/return`       | `false`         | OAuth callback: verify `state`, exchange `code` for tokens, create session |
| `GET /auth/sign-out`      | `defra-session` | Drop session from cache, clear Yar, 302 home                               |
| `GET /auth/sign-out-oidc` | `false`         | Defra ID logout callback; failsafe session clear                           |

## Sessions, tokens & cookies

- **Session store:** `server.app.sessionCache` (Catbox, segment `sessions`, 24h TTL). Holds the
  full `userSession`: `{ sessionId (uuid), isAuthenticated, profile, token, refreshToken, role, scope }`.
- **Yar cookie:** server-side backed (`maxCookieSize: 0`), `httpOnly`, `SameSite=Lax`. Stores only
  `sessionId`, plus transient `oauth_state` and `redirectTo`. Default 4h TTL (`session.*` config).
- **Bell cookie:** `bell-defra-id`, temporary OAuth transaction cookie.
- **Token refresh:** on every `defra-session` request the access token is decoded and time-checked
  (60s skew). If expired and `defraId.refreshTokens` is on, a `refresh_token` grant is made and the
  new tokens are persisted transparently. If refresh is off or fails, the session is dropped and the
  user is unauthenticated. See [token-refresh-flow.mermaid](./token-refresh-flow.mermaid).

## Flow diagrams

- [Sign in flow](./sign-in-flow.mermaid)
- [Token refresh flow](./token-refresh-flow.mermaid)
- [Sign out flow](./sign-out-flow.mermaid)

## Config (`defraId.*`)

`enabled`, `wellKnownUrl`, `clientId`, `clientSecret`, `redirectUrl`, `serviceId`,
`refreshTokens`, `scopes` (default `openid offline_access`). See `src/config/config.js`.

---

## Local setup — real Defra ID

Copy `.env.template` to `.env` and populate:

- `DEFRA_ID_CLIENT_ID`, `DEFRA_ID_SERVICE_ID`, `DEFRA_ID_SCOPES` — copy from
  [cdp-app-config](https://github.com/DEFRA/cdp-app-config/blob/main/services/nrf-frontend/test/nrf-frontend.env).
- `DEFRA_ID_CLIENT_SECRET` — get from another dev, or retrieve nrf-frontend test secrets via the
  [CDP terminal](https://portal.cdp-int.defra.cloud/documentation/how-to/terminal.md#are-my-service-secrets-available-from-the-terminal-).

Sign out from the profile page: http://localhost:3000/profile

## Local setup — Defra ID stub

1. Use the default values in `config.js` (don't override with `.env`).
2. `docker compose up --build -d` — runs the stub plus dependencies.
3. `npm run dev` — start the frontend.

First run, on **DEFRA ID Stub User Set Up**:

1. Enter email, first name, last name.
2. Enrolments: `1`. Enrolment requests: `1`.

On **New User Relationships**:

1. Enter any Relationship ID, Organisation ID, Organisation Name.
2. Choose a user type (e.g. Citizen), click **Add relationship**.
3. Scroll to the bottom, click **Finish**.
4. Instead of clicking Login, set the browser address to http://localhost:3000.
5. Click **Log in**.
