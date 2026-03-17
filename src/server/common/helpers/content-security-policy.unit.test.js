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

  test('should include map style origin in connectSrc when configured', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'map.styleUrl') {
        return 'https://tiles.example.com/style.json'
      }
      if (key === 'cdpUploader.url') {
        return null
      }
      return null
    })

    const { contentSecurityPolicy } =
      await import('./content-security-policy.js')

    expect(contentSecurityPolicy.options.connectSrc).toContain(
      'https://tiles.example.com'
    )
    expect(contentSecurityPolicy.options.formAction).toEqual(['self'])
  })

  test('should include cdpUploader url in formAction when configured', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'map.styleUrl') {
        return null
      }
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
      'data:'
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
      'data:'
    ])
    expect(contentSecurityPolicy.options.formAction).toEqual(['self'])
  })
})
