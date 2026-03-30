import { config } from './config.js'

describe('#config', () => {
  describe('in production environment (NODE_ENV=production)', () => {
    let prodConfig

    beforeAll(async () => {
      const original = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      vi.resetModules()
      ;({ config: prodConfig } = await import('./config.js'))
      process.env.NODE_ENV = original
    })

    test('log.format is ecs', () => {
      expect(prodConfig.get('log.format')).toBe('ecs')
    })

    test('log.redact contains production paths', () => {
      expect(prodConfig.get('log.redact')).toEqual([
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers'
      ])
    })

    test('session.cache.engine is redis', () => {
      expect(prodConfig.get('session.cache.engine')).toBe('redis')
    })

    test('session.cookie.secure is true', () => {
      expect(prodConfig.get('session.cookie.secure')).toBe(true)
    })

    test('redis.port is 6379', () => {
      expect(prodConfig.get('redis.port')).toBe('6379')
    })

    test('redis.useTLS is true', () => {
      expect(prodConfig.get('redis.useTLS')).toBe(true)
    })
  })

  describe('in test environment (NODE_ENV=test)', () => {
    test('log.enabled is false', () => {
      expect(config.get('log.enabled')).toBe(false)
    })

    test('log.format is pino-pretty', () => {
      expect(config.get('log.format')).toBe('pino-pretty')
    })

    test('log.redact is empty', () => {
      expect(config.get('log.redact')).toEqual([])
    })

    test('isSecureContextEnabled is false', () => {
      expect(config.get('isSecureContextEnabled')).toBe(false)
    })

    test('isMetricsEnabled is false', () => {
      expect(config.get('isMetricsEnabled')).toBe(false)
    })

    test('session.cache.engine is redis', () => {
      expect(config.get('session.cache.engine')).toBe('redis')
    })

    test('session.cache.name is session', () => {
      expect(config.get('session.cache.name')).toBe('session')
    })

    test('session.cache.ttl is 14400000', () => {
      expect(config.get('session.cache.ttl')).toBe(14400000)
    })

    test('session.cookie.secure is false', () => {
      expect(config.get('session.cookie.secure')).toBe(false)
    })

    test('session.cookie.ttl is 14400000', () => {
      expect(config.get('session.cookie.ttl')).toBe(14400000)
    })

    test('redis.port is 6380', () => {
      expect(config.get('redis.port')).toBe('6380')
    })

    test('redis.useSingleInstanceCache is true', () => {
      expect(config.get('redis.useSingleInstanceCache')).toBe(true)
    })

    test('redis.useTLS is false', () => {
      expect(config.get('redis.useTLS')).toBe(false)
    })

    test('nunjucks.watch is false', () => {
      expect(config.get('nunjucks.watch')).toBe(false)
    })

    test('nunjucks.noCache is false', () => {
      expect(config.get('nunjucks.noCache')).toBe(false)
    })

    test('cookie.isSecure is false', () => {
      expect(config.get('cookie.isSecure')).toBe(false)
    })

    test('map.defaultStyleUrl is set', () => {
      expect(config.get('map.defaultStyleUrl')).toBe(
        '/public/data/vts/OS_VTS_3857_Outdoor.json'
      )
    })
  })
})
