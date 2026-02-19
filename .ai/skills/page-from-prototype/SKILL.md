---
name: page-from-prototype
description: Create a new page and associated files by parsing a prototype page
---

## Parameters

1. **Prototype page file** - the relative path to a prototype page under the source folder (see below), eg `start.html`
2. **Route ID** e.g. `start`. This will be the last part of the page URL and also the folder name for the files

## Definitions

'source folder' - `../nrf-prototypes/app/views/nrf-quote-4` relative to this repository's root (i.e. the `nrf-prototypes` repository is a sibling directory of this one).
'target folder' - the folder below `src/server/quote` that is named after the route ID, eg `src/server/quote/start`

## Create a nunjucks view

### Steps

1. Read the source HTML page at `../nrf-prototypes/app/views/nrf-quote-4/{prototype page file}` (relative to this repository's root). If the page can't be found, stop execution and inform the user
2. **Copy only the `<main>` element content** from the HTML page. Ignore everything outside `<main>` (header, footer, nav, phase banners, etc.) as these are handled by the layout template.
3. **Generate a Nunjucks view file** at `{target folder}/index.njk` following the rules below.

### Output file structure

The generated `index.njk` must:

- Extend `layouts/page.njk`
- Define a `{% block pageTitle %}` containing only a `{{pageTitle}}` variable.
- If there is a `beforeContent` block in the source page, then create one in the generated page containing the `govukBackLink` macro and set the href to the variable `backLink` (which will be provided in the view model below)
- Remember the text contents value of the `<h1>` tag (that will be used to set the pageTitle value in the view model later), and replace the `<h1>` contents with `{{pageTitle}}`
- Define a `{% block content %}` containing the converted markup
- Use GOV.UK Design System Nunjucks macros for recognised components (see Component Mapping below)
- Keep all other GOV.UK Frontend CSS classes as-is in the HTML (headings, body text, grid classes, lists, etc.)
- Replace all `href` values in links with `#` (except `mailto:` links which should be kept as-is)
- For Nunjucks macros import statements, check if already imported in `layouts/page.njk` and if not, add there rather than in the page `index.njk`
- Add a hidden input inside any opening form elements - <input type="hidden" name="csrfToken" value="{{ csrfToken }}"/>
- Remove the form action so that it posts to the same URL

### Example

Use `src/server/quote/start/index.njk` as an example of the target output format and conventions.

### Component mapping

When the prototype HTML contains elements matching these patterns, convert them to the corresponding Nunjucks macro.

For each matched component, fetch the reference URL (without JavaScript) and locate the Nunjucks code example to determine the correct import statement and macro call syntax.

| CSS class pattern     | Component     | Macro reference                                                                                   |
| --------------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `govuk-button`        | Button        | https://design-system.service.gov.uk/components/button/#button-example-nunjucks                   |
| `govuk-error-message` | Error message | https://design-system.service.gov.uk/components/error-message/#error-message-example-nunjucks     |
| `govuk-error-summary` | Error summary | https://design-system.service.gov.uk/components/error-summary/#error-summary-example-nunjucks     |
| `govuk-fieldset`      | Fieldset      | https://design-system.service.gov.uk/components/fieldset/#address-group-fieldset-example-nunjucks |
| `govuk-radios`        | Radios        | https://design-system.service.gov.uk/components/radios/#radios-example-nunjucks                   |

## Create a view model

This is a simple function that returns the data that will be used to render data placeholders eg `{{pageTitle}}` in the nunjucks view.
Create a file called `get-view-model.js` in the target folder with a default export that returns an object including the following properties:

- `pageTitle`, which should have the value of the page title that was read from the source page `<h1>`
- `backLink` - set this to '#'

## Create a route file

Every page created will require a GET route. Create a file called `routes.js` in the target folder with a default export that is an array of route definitions. Each route should be passed the route ID and the view model function that was created above. See `src/server/quote/start/routes.js` for the pattern to follow, except for the routePath format - for new routes it should use the format `/quote/{routeId}`.
Then, import and spread the routes into `src/server/quote/index.js` (there is an example in there to follow for the start routes)

## Create a page test

Create a test file in the target folder. See `src/server/quote/start/page.test.js` for the pattern to follow.
The test file should import the `routePath` from the route file and load the page then assert that the page heading is correct.
Run the test and confirm it passes.
