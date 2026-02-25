import { fileURLToPath } from 'node:url'
import path from 'node:path'
import nunjucks from 'nunjucks'
import { JSDOM } from 'jsdom'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const nunjucksTestEnv = nunjucks.configure(
  [
    'node_modules/govuk-frontend/dist/',
    path.normalize(path.resolve(dirname, '../server/common/components'))
  ],
  {
    trimBlocks: true,
    lstripBlocks: true
  }
)

export function renderNunjucksComponent({ folder, componentName, params }) {
  const macroPath = `${folder}/macro.njk`
  const macroParams = JSON.stringify(params, null, 2)
  const macroString = `
  {%- from "${macroPath}" import ${componentName} -%}
  {{- ${componentName}(${macroParams}) -}}
  `
  const html = nunjucksTestEnv.renderString(macroString, {})
  const dom = new JSDOM(html)
  return dom.window.document
}
