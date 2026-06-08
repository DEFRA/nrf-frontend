const confirmationKey = 'resendConfirmation'

// One-shot session store for the resend confirmation message, so the POST
// handler can hand it to the GET confirmation page across a redirect (PRG).
export const saveResendConfirmationToCache = (request, { message }) => {
  request.yar.set(confirmationKey, { message })
}

export const takeResendConfirmationFromCache = (request) => {
  const confirmation = request.yar.get(confirmationKey)
  request.yar.clear(confirmationKey)
  return confirmation
}
