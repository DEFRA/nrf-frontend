import { ecsFormat } from '@elastic/ecs-pino-format'
import { config } from '../../../../config/config.js'
import { getTraceId } from '@defra/hapi-tracing'
import { structureErrorForECS } from './log-formatters.js'

const logConfig = config.get('log')
const serviceName = config.get('serviceName')
const serviceVersion = config.get('serviceVersion')

const ecsOptions = ecsFormat({ serviceVersion, serviceName })

const formatters = {
  ecs: {
    ...ecsOptions,
    formatters: {
      ...ecsOptions.formatters,
      log(object) {
        if (object.err instanceof Error) {
          const { err, ...rest } = object
          const ecsFormatted = ecsOptions.formatters?.log
            ? ecsOptions.formatters.log(rest)
            : rest
          return { ...ecsFormatted, ...structureErrorForECS(err) }
        }
        return ecsOptions.formatters?.log
          ? ecsOptions.formatters.log(object)
          : object
      }
    }
  },
  'pino-pretty': { transport: { target: 'pino-pretty' } }
}

export const loggerOptions = {
  enabled: logConfig.enabled,
  ignoreFunc(_options, request) {
    return (
      request.path === '/health' ||
      request.route.path.startsWith('/assets') ||
      /\.(js|css|map|ico|png|jpg|jpeg|svg|woff|woff2|ttf|eot|json)$/i.test(
        request.path
      )
    )
  },
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  mixin() {
    const mixinValues = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  },
  getChildBindings(request) {
    return {
      url: {
        path: request.url.pathname
      }
    }
  }
}
