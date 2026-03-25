import { vi } from 'vitest'

const mockReadFileSync = vi.fn()
const mockStatSync = vi.fn()
const mockLoggerError = vi.fn()

vi.mock('node:fs', async () => {
  const nodeFs = await import('node:fs')

  return {
    ...nodeFs,
    readFileSync: () => mockReadFileSync(),
    statSync: () => mockStatSync()
  }
})
vi.mock('../../../server/common/helpers/git-hash.js', () => ({
  gitHash: 'abc123'
}))
vi.mock('../../../server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

describe('context and cache', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset()
    mockStatSync.mockReset()
    mockLoggerError.mockReset()
    vi.resetModules()
  })

  describe('#context', () => {
    const mockRequest = { path: '/' }

    describe('When webpack manifest file read succeeds', () => {
      let contextImport
      let contextResult

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(() => {
        mockStatSync.mockReturnValue({ mtimeMs: 1 })
        // Return JSON string
        mockReadFileSync.mockReturnValue(`{
        "application.js": "javascripts/application.js",
        "stylesheets/application.scss": "stylesheets/application.css"
      }`)

        contextResult = contextImport.context(mockRequest)
      })

      test('Should provide expected context', () => {
        expect(contextResult).toEqual({
          assetPath: '/public/assets',
          breadcrumbs: [],
          getAssetPath: expect.any(Function),
          isAuthenticated: false,
          navigation: [
            {
              current: true,
              text: 'Home',
              href: '/'
            },
            {
              current: false,
              text: 'About',
              href: '/about'
            },
            {
              current: false,
              text: 'Sign in',
              href: '/login'
            }
          ],
          serviceName: 'Nature Restoration Fund',
          serviceVersion: 'abc123',
          serviceUrl: '/',
          user: null
        })
      })

      describe('With valid asset path', () => {
        test('Should provide expected asset path', () => {
          expect(contextResult.getAssetPath('application.js')).toBe(
            '/public/javascripts/application.js'
          )
        })
      })

      describe('With invalid asset path', () => {
        test('Should provide expected asset', () => {
          expect(contextResult.getAssetPath('an-image.png')).toBe(
            '/public/an-image.png'
          )
        })
      })
    })

    describe('When webpack manifest file read fails', () => {
      let contextImport

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(() => {
        mockStatSync.mockImplementation(() => {
          throw new Error('File not found')
        })
        mockReadFileSync.mockReturnValue(new Error('File not found'))

        contextImport.context(mockRequest)
      })

      test('Should log that the Webpack Manifest file is not available', () => {
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Webpack assets-manifest.json not found'
        )
      })
    })
  })

  describe('#context cache', () => {
    const mockRequest = { path: '/' }
    let contextResult

    describe('Webpack manifest file cache', () => {
      let contextImport

      beforeEach(async () => {
        contextImport = await import('./context.js')
        mockStatSync.mockReturnValue({ mtimeMs: 1 })
        // Return JSON string
        mockReadFileSync.mockReturnValue(`{
        "application.js": "javascripts/application.js",
        "stylesheets/application.scss": "stylesheets/application.css"
      }`)

        contextResult = contextImport.context(mockRequest)
      })

      test('Should read file', () => {
        expect(mockReadFileSync).toHaveBeenCalled()
      })

      test('Should use cache', () => {
        contextImport.context(mockRequest)
        expect(mockReadFileSync).toHaveBeenCalledTimes(1)
      })

      test('Should refresh cache when manifest file changes', () => {
        contextImport.context(mockRequest)
        expect(mockReadFileSync).toHaveBeenCalledTimes(1)

        mockStatSync.mockReturnValue({ mtimeMs: 2 })
        contextImport.context(mockRequest)

        expect(mockReadFileSync).toHaveBeenCalledTimes(2)
      })

      test('Should provide expected context', () => {
        expect(contextResult).toEqual({
          assetPath: '/public/assets',
          breadcrumbs: [],
          getAssetPath: expect.any(Function),
          isAuthenticated: false,
          navigation: [
            {
              current: true,
              text: 'Home',
              href: '/'
            },
            {
              current: false,
              text: 'About',
              href: '/about'
            },
            {
              current: false,
              text: 'Sign in',
              href: '/login'
            }
          ],
          serviceName: 'Nature Restoration Fund',
          serviceVersion: 'abc123',
          serviceUrl: '/',
          user: null
        })
      })
    })
  })
})
