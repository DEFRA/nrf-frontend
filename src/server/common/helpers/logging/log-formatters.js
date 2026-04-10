function extractHttpStatusCode(error) {
  return (
    error.response?.statusCode ||
    error.res?.statusCode ||
    error.statusCode ||
    error.status ||
    error.output?.statusCode
  )
}

function buildHttpContext(statusCode) {
  return statusCode ? { response: { status_code: statusCode } } : undefined
}

function buildErrorMessage(error) {
  const baseMessage =
    (error && typeof error.message === 'string' && error.message) ||
    String(error)

  const payload =
    (error && typeof error === 'object' && 'data' in error && error.data) ||
    error?.response?.data

  if (!payload) {
    return baseMessage
  }

  try {
    const serialisedPayload =
      typeof payload === 'string' ? payload : JSON.stringify(payload)
    return `${baseMessage} | response: ${serialisedPayload}`
  } catch {
    return baseMessage
  }
}

function buildErrorDetails(error) {
  const details = {
    message: buildErrorMessage(error),
    stack_trace: error.stack || undefined,
    type: error.name || error.constructor?.name || 'Error',
    code: error.code || error.statusCode || undefined
  }
  for (const key of Object.keys(details)) {
    if (details[key] === undefined) {
      delete details[key]
    }
  }
  return details
}

function structureErrorForECS(error) {
  if (!error) {
    return {}
  }

  const statusCode = extractHttpStatusCode(error)
  const errorObj = { error: buildErrorDetails(error) }
  const httpContext = buildHttpContext(statusCode)
  if (httpContext) {
    errorObj.http = httpContext
  }
  return errorObj
}

export { structureErrorForECS }
