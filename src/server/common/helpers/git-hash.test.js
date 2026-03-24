describe('git-hash', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('Should return GIT_HASH env var when set', async () => {
    vi.stubEnv('GIT_HASH', 'env-hash-123')

    const { gitHash } = await import('./git-hash.js')

    expect(gitHash).toBe('env-hash-123')
  })

  test('Should return "unknown" when GIT_HASH is not set and .git-hash file does not exist', async () => {
    vi.stubEnv('GIT_HASH', '')

    const { gitHash } = await import('./git-hash.js')

    expect(gitHash).toBe('unknown')
  })
})
