import { renderNunjucksComponent } from '../../../../test-utils/render-nunjucks-component.js'
import { getByRole } from '@testing-library/dom'

describe('backLink Component', () => {
  test('Should render back link correctly with default text', () => {
    const dom = renderNunjucksComponent({
      folder: 'back-link',
      componentName: 'backLink',
      params: {
        href: '/test-link'
      }
    })
    expect(getByRole(dom, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/test-link'
    )
  })
})
