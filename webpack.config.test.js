import { existsSync } from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import webpackConfig from './webpack.config.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('webpack config', () => {
  it('copies the interactive-map map key plugin stylesheet to the path referenced by the page templates', () => {
    const copyPlugin = webpackConfig.plugins.find(
      (plugin) => plugin.constructor.name === 'CopyPlugin'
    )

    const mapKeyPattern = copyPlugin.patterns.find(
      (pattern) => pattern.to === 'interactive-map/plugins/map-key/index.css'
    )

    expect(mapKeyPattern).toBeTruthy()
    expect(mapKeyPattern.from).toBe(
      path.join(
        dirname,
        'node_modules',
        '@defra',
        'interactive-map',
        'plugins/map-key/dist/css/index.css'
      )
    )
    expect(existsSync(mapKeyPattern.from)).toBe(true)
  })
})
