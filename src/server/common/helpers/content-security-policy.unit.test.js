const mockConfigGet = vi.hoisted(() => vi.fn())

vi.mock('../../../config/config.js', () => ({
  config: {
    get: mockConfigGet
  }
}))

describe('#contentSecurityPolicy config variations', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('should always include base-uri self', async () => {
    mockConfigGet.mockImplementation(() => null)

    const { contentSecurityPolicy } =
      await import('./content-security-policy.js')

    expect(contentSecurityPolicy.options.baseUri).toEqual(['self'])
  })

  test('should include cdpUploader url in formAction when configured', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'cdpUploader.url') {
        return 'https://uploader.example.com'
      }
      return null
    })

    const { contentSecurityPolicy } =
      await import('./content-security-policy.js')

    expect(contentSecurityPolicy.options.connectSrc).toEqual([
      'self',
      'wss',
      'https://raw.githubusercontent.com',
      'https://server.arcgisonline.com'
    ])
    expect(contentSecurityPolicy.options.imgSrc).toEqual([
      'self',
      'data:',
      'https://raw.githubusercontent.com',
      'https://server.arcgisonline.com'
    ])
    expect(contentSecurityPolicy.options.formAction).toContain(
      'https://uploader.example.com'
    )
  })

  test('should exclude optional origins when not configured', async () => {
    mockConfigGet.mockImplementation(() => null)

    const { contentSecurityPolicy } =
      await import('./content-security-policy.js')

    expect(contentSecurityPolicy.options.connectSrc).toEqual([
      'self',
      'wss',
      'https://raw.githubusercontent.com',
      'https://server.arcgisonline.com'
    ])
    expect(contentSecurityPolicy.options.imgSrc).toEqual([
      'self',
      'data:',
      'https://raw.githubusercontent.com',
      'https://server.arcgisonline.com'
    ])
    expect(contentSecurityPolicy.options.formAction).toEqual(['self'])
  })

  test('should include googletagmanager.com in scriptSrc, frameSrc and connectSrc when gtmId is configured', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'gtmId') return 'GTM-TEST123'
      return null
    })

    const { contentSecurityPolicy } =
      await import('./content-security-policy.js')

    expect(contentSecurityPolicy.options.scriptSrc).toContain(
      'https://*.googletagmanager.com'
    )
    expect(contentSecurityPolicy.options.frameSrc).toContain(
      'https://*.googletagmanager.com'
    )
    expect(contentSecurityPolicy.options.connectSrc).toContain(
      'https://*.googletagmanager.com'
    )
    expect(contentSecurityPolicy.options.connectSrc).toContain(
      'https://*.google-analytics.com'
    )
  })

  test('should exclude googletagmanager.com from scriptSrc, frameSrc and connectSrc when gtmId is not configured', async () => {
    mockConfigGet.mockImplementation(() => null)

    const { contentSecurityPolicy } =
      await import('./content-security-policy.js')

    expect(contentSecurityPolicy.options.scriptSrc).not.toContain(
      'https://*.googletagmanager.com'
    )
    expect(contentSecurityPolicy.options.frameSrc).not.toContain(
      'https://*.googletagmanager.com'
    )
    expect(contentSecurityPolicy.options.connectSrc).not.toContain(
      'https://*.googletagmanager.com'
    )
    expect(contentSecurityPolicy.options.connectSrc).not.toContain(
      'https://*.google-analytics.com'
    )
  })
})
