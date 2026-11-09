export const unsafeRedirectUrls = [
  ['an absolute URL', 'https://evil.example.com'],
  ['a protocol-relative URL', '//evil.example.com'],
  ['a backslash protocol-relative URL', '/\\evil.example.com'],
  ['an encoded backslash protocol-relative URL', '/%5Cevil.example.com'],
  ['an encoded protocol-relative URL', '/%2f%2fevil.example.com'],
  ['a tab protocol-relative URL', '/\t/evil.example.com'],
  ['a newline protocol-relative URL', '/\n/evil.example.com']
]
