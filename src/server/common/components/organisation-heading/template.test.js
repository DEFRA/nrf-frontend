import { JSDOM } from 'jsdom'
import { within } from '@testing-library/dom'
import { renderComponent } from '../../test-helpers/component-helpers.js'

const changeOrganisationLinkName = 'Change organisation'

const render = (params) =>
  within(
    new JSDOM(renderComponent('organisation-heading', params).html()).window
      .document.body
  )

describe('appOrganisationHeading Component', () => {
  it('renders the organisation name', () => {
    const view = render({ orgOrUserName: 'Test Org' })

    expect(view.getByText('Test Org')).toBeInTheDocument()
  })

  it('renders nothing when there is no organisation name', () => {
    const view = render({
      orgOrUserName: undefined,
      changeOrganisationUrl: '/auth/change-organisation'
    })

    expect(
      view.queryByTestId('app-organisation-heading')
    ).not.toBeInTheDocument()
  })

  it('links to the given change organisation URL', () => {
    const view = render({
      orgOrUserName: 'Test Org',
      changeOrganisationUrl: '/auth/change-organisation?redirectTo=%2Fprofile'
    })

    const link = view.getByRole('link', { name: changeOrganisationLinkName })
    expect(link).toHaveAttribute(
      'href',
      '/auth/change-organisation?redirectTo=%2Fprofile'
    )
    expect(link).toHaveClass('govuk-link')
  })

  it('does not show the change organisation link without a URL', () => {
    const view = render({ orgOrUserName: 'Test Org' })

    expect(
      view.queryByRole('link', { name: changeOrganisationLinkName })
    ).not.toBeInTheDocument()
  })
})
