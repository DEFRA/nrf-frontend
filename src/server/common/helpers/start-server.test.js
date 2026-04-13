import { vi } from 'vitest'

import hapi from '@hapi/hapi'
import Wreck from '@hapi/wreck'
import { statusCodes } from '../constants/status-codes.js'
import { config } from '../../../config/config.js'
import * as createServerImport from '../../server.js'
import * as startServerImport from './start-server.js'

describe('#startServer', () => {
  let createServerSpy
  let hapiServerSpy
  let originalPort

  beforeAll(() => {
    originalPort = config.get('port')
    config.set('port', 3097)

    createServerSpy = vi.spyOn(createServerImport, 'createServer')
    hapiServerSpy = vi.spyOn(hapi, 'server')
  })

  afterAll(() => {
    config.set('port', originalPort)
  })

  describe('When server starts', () => {
    let server

    afterAll(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should start up server as expected', async () => {
      const wreckSpy = vi
        .spyOn(Wreck, 'get')
        .mockResolvedValue({ payload: { message: 'success' } })

      server = await startServerImport.startServer()

      expect(createServerSpy).toHaveBeenCalled()
      expect(hapiServerSpy).toHaveBeenCalled()

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(result).toEqual({ message: 'success' })
      expect(statusCode).toBe(statusCodes.ok)

      wreckSpy.mockRestore()
    })
  })

  describe('When server start fails', () => {
    test('Should log failed startup message', async () => {
      createServerSpy.mockRejectedValue(new Error('Server failed to start'))

      await expect(startServerImport.startServer()).rejects.toThrow(
        'Server failed to start'
      )
    })
  })
})

describe('#checkBackendConnectivity', () => {
  let checkBackendConnectivity
  const mockLogger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() }

  beforeAll(async () => {
    const mod = await import('./start-server.js')
    checkBackendConnectivity = mod.checkBackendConnectivity
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should log success when backend is reachable', async () => {
    const wreckSpy = vi
      .spyOn(Wreck, 'get')
      .mockResolvedValue({ payload: { message: 'success' } })

    await checkBackendConnectivity(mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Backend configuration')
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Backend is reachable')
    )
    expect(mockLogger.error).not.toHaveBeenCalled()

    wreckSpy.mockRestore()
  })

  test('Should warn and continue when ignore errors flag is set', async () => {
    const wreckSpy = vi
      .spyOn(Wreck, 'get')
      .mockRejectedValue(new Error('ECONNREFUSED'))

    const { config } = await import('../../../config/config.js')
    config.set('backend.optional', true)

    await checkBackendConnectivity(mockLogger)

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.stringContaining('Backend connectivity check failed')
    )
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('NRF_BACKEND_OPTIONAL')
    )

    config.set('backend.optional', false)
    wreckSpy.mockRestore()
  })

  test('Should throw when backend is unreachable', async () => {
    const wreckSpy = vi
      .spyOn(Wreck, 'get')
      .mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(checkBackendConnectivity(mockLogger)).rejects.toThrow(
      'Backend is not reachable'
    )

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Backend configuration')
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.stringContaining('Backend connectivity check failed')
    )
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.stringContaining('ECONNREFUSED')
    )

    wreckSpy.mockRestore()
  })
})
