import { patchRequestToBackend } from '../common/services/nrf-backend.js'

/**
 * Builds the PATCH /users/{defraId} payload from a session profile. Organisation fields are
 * only included when the user signed in as an organisation (Employee/Agent) — a Citizen has
 * no organisation to link.
 * Assumes the Defra ID token always carries firstName/lastName claims — if that turns out not
 * to be true for some account types, the backend schema and this payload will need to allow
 * for their absence.
 * @param {object} profile - session profile built from the Defra ID token in auth/controller.js
 * @returns {object} payload for PATCH /users/{defraId}
 */
const buildSyncPayload = (profile) => {
  const payload = {
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName
  }

  const { organisationId, organisationName, userRelationshipType } =
    profile.organisation ?? {}

  if (organisationId) {
    payload.organisationDefraId = organisationId
    payload.organisationName = organisationName ?? ''
    if (userRelationshipType) {
      payload.relationshipType = userRelationshipType
    }
  }

  return payload
}

/**
 * Syncs the signed-in user's profile to nrf-backend (PATCH /users/{defraId}), then marks the
 * session as saved so it only happens once per session. Fired fire-and-forget from the
 * defra-session strategy; when it fails the flag stays unset so the next authenticated
 * request for this session retries.
 * @param {Object} params
 * @param {{ sessionId: string, profile?: object }} params.userSession - session from the cache
 * @param {object} params.sessionCache - server-side session cache (server.app.sessionCache)
 */
export const syncUserToBackend = async ({ userSession, sessionCache }) => {
  const profile = userSession.profile ?? {}

  if (profile.id && profile.email) {
    await patchRequestToBackend({
      endpointPath: `/users/${profile.id}`,
      payload: buildSyncPayload(profile)
    })
  }

  // Marked saved even when there was nothing to sync, so we don't re-check every request
  userSession.userSaved = true

  await sessionCache.set(userSession.sessionId, userSession)
}
