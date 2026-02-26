---
name: page-from-prototype
description: Create a new page and associated files by parsing a prototype page
---

## Parameters

1. **Prototype page sub-path** - the relative path to a prototype page under the source folder (see below), eg `nrf-quote-4/start.html`
2. **Route ID** e.g. `start`. This will be the last part of the page URL and also the folder name for the files
3. **Prototype content markdown sub-path** (optional) - the filename of the prototype content markdown file under `../nrf-prototypes/prompts/implementation`. This will only be used if the source page contains a form. If it's passed as a parameter, don't read the file immediately as it's large. Instructions on which section to focus on are in the form validation section below.

## Terms

- 'source folder' - `../nrf-prototypes/app/views` relative to this repository's root (i.e. the `nrf-prototypes` repository is a sibling directory of this one).
- 'target folder' - the folder below `src/server/quote` that is named after the route ID, eg `src/server/quote/start`
- 'content markdown' - the markdown file located using parameter 3

## Create a nunjucks page

### Steps

1. Read the source HTML page at `../nrf-prototypes/app/views/{prototype page sub-path}` (relative to this repository's root). If the page can't be found, stop execution and inform the user
2. **Copy only the `<main>` element content** from the HTML page. Ignore everything outside `<main>` (header, footer, nav, phase banners, etc.) as these are handled by the layout template.
3. **Generate a Nunjucks view file** at `{target folder}/index.njk` following the rules below.

### Examples

Use `src/server/quote/start/index.njk` as an example of the target output format and conventions, for a simple content page not containing a form.
If the source page does contain a form, use `src/server/quote/boundary-type/index.njk` as an example.

### Output file structure

The generated `index.njk` must:

- Extend `layouts/page.njk`
- Define a `{% block pageTitle %}` containing only a `{{pageTitle}}` variable.
- If there is a `beforeContent` block in the source page, then create one in the generated page containing the `govukBackLink` macro and set the href to the variable `backLink` (which will be provided in the view model below)
- replace any occurrences of the class `govuk-grid-column-two-thirds` with `govuk-grid-column-two-thirds-from-desktop`
- Remember the text contents value of the `<h1>` tag (that will be used to set the pageTitle value in the view model later), and replace the `<h1>` contents with `{{pageHeading}}`
- Define a `{% block content %}` containing the converted markup
- Use GOV.UK Design System Nunjucks macros for recognised components (see Component Mapping below)
- Keep all other GOV.UK Frontend CSS classes as-is in the HTML (headings, body text, grid classes, lists, etc.)
- Replace all `href` values in links with `#` (except `mailto:` links which should be kept as-is)
- For Nunjucks macros import statements, check if already imported in `layouts/page.njk` and if not, add there rather than in the page `index.njk`

### Forms

If the source file contains a form element, there are some extra steps:

- Remove the form action so that it posts to the same URL
- Keep the `novalidate` attribute
- if a form group legend is also the page heading, use a `{% set legendHtml %}` statement to set it
- Preserve any Nunjucks template expressions found in the source page, but rename the `data` object to `formSubmitData` (e.g. `{{ data.nrfReference }}` becomes `{{ formSubmitData.nrfReference }}`).
- For any property names that were under the `data` object, rename them to camelCase (e.g. `formSubmitData['building-types']` becomes `formSubmitData.buildingTypes`). These new property names will be used in the form validation file.
- For the value attribute that will be passed to form fields, take the field's text value and lowercase then hyphenate it (e.g. 'Other residential' becomes 'other-residential')
- In the source file, the `checked` attribute of radio and checkbox elements will be set using a data property eg `data['hasRedlineBoundaryFile']`. For each radio or checkbox macro in the generated page: set `name` to the field name as a plain string (e.g. `name: "boundaryEntryType"`); for radios set `value: formSubmitData.boundaryEntryType`; for checkboxes set `values: formSubmitData.hasRedlineBoundaryFile` (the GOV.UK checkboxes macro expects an array, not a scalar). This ensures the previously submitted value is pre-selected when the form is re-rendered after a validation error.
- Use the same data property name as a property of `validationErrors.messagesByFormField` to set each form group's errorMessage property
- For items arrays passed to the radios or checkboxes macro, do not set id attributes for each form group item
- Prefix the `pageTitle` block value with `{% if validationErrors %}Error: {% endif %}`
- Add an error summary macro above the content, wrapped in an if statement that checks for `validationErrors`. Use `titleText: "There is a problem"` and `errorList: validationErrors.summary`.

### Component mapping

When the prototype HTML contains elements matching these patterns, convert them to the corresponding Nunjucks macro.

For each matched component, fetch the reference URL (without JavaScript) and locate the Nunjucks code example to determine the correct import statement and macro call syntax.

If it's a form field component, just pass the `name` attribute in, no need to pass `id` attribute as it will default to re-using the `name` for the `id`.

| CSS class pattern     | Component     | Macro reference                                                                               |
| --------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `govuk-button`        | Button        | https://design-system.service.gov.uk/components/button/#button-example-nunjucks               |
| `govuk-error-message` | Error message | https://design-system.service.gov.uk/components/error-message/#error-message-example-nunjucks |
| `govuk-error-summary` | Error summary | https://design-system.service.gov.uk/components/error-summary/#error-summary-example-nunjucks |
| `govuk-radios`        | Radios        | https://design-system.service.gov.uk/components/radios/#radios-example-nunjucks               |
| `govuk-checkboxes`    | Checkboxes    | https://design-system.service.gov.uk/components/checkboxes/#checkboxes-example-nunjucks       |
| `govuk-panel`         | Panel         | https://design-system.service.gov.uk/components/panel/#panel-example-nunjucks                 |

## Create a view model

This is a simple function that returns the data that will be used to render data placeholders eg `{{pageTitle}}` in the nunjucks view.
Create a file called `get-view-model.js` in the target folder with a default export that returns an object including the following properties:

- `pageTitle`, which should have the value of the page title that was read from the source page `<h1>`, plus ' - Gov.uk'
- `pageHeading`, which should have the value of the page title that was read from the source page `<h1>`
- `backLink` - set this to '#'

## Create a form validation file (if the source page has a form)

Create a file called `form-validation.js` in the target folder with a default export function that returns a Joi schema to validate the request body from the form submission. See `src/server/quote/boundary-type/form-validation.js` for an example. The Joi schema should check for each form input group name that's present in the page form, using the following rules per input type:

- **Radio buttons / selects**: When nothing is selected the field is absent from the payload, so use `joi.string().valid(...allowedValues).required()` where `allowedValues` is the list of `value` strings from the radio/select items. Handle both `'any.required'` (field absent) and `'any.only'` (unrecognised value submitted) — use the same error message for both.
- **Checkbox groups**: When nothing is checked the field is absent from the payload; if at least one must be checked, use `joi.array().items(joi.string().valid(...allowedValues)).single().required()` where `allowedValues` is the list of valid checkbox values. The `.single()` call is required because when only one checkbox is checked the browser submits a plain string rather than an array — `.single()` tells Joi to accept and wrap it. Handle `'any.required'` (nothing checked) and `'any.only'` (unrecognised value submitted) — use the same error message for both. Do not add `'array.min'` — it is unreachable because an empty array is never submitted via a normal HTML form.
- **Text inputs (required)**: An empty string is submitted when the field is blank, so handle both `'string.empty'` and `'any.required'` error keys
- **Text inputs (optional)**: Use `joi.string().allow('')` — no error messages needed. Always include optional fields in the schema; omitting them causes Hapi to reject submissions that include them as unknown fields.
- **Email inputs** (type="email"): Treat as a text input but also add `.email({ tlds: { allow: false } })` to validate the format. Handle `'string.empty'`, `'any.required'`, and `'string.email'` (invalid format). Use `tlds: { allow: false }` to avoid Joi rejecting valid addresses due to unknown TLDs. The GOV.UK-standard format error message is `'Enter an email address in the correct format, like name@example.com'`.
- **Number inputs** (type="number"): Hapi validates with `convert: true` by default, so use `joi.number().integer().required()`. Handle `'any.required'` (field absent), `'number.base'` (empty or non-numeric value), and `'number.integer'` (fractional number submitted). Do not use `joi.string()` — Joi will attempt to coerce the submitted string to a number before applying further rules.

### Validation error messages

If parameter 3 was not provided, use sensible placeholder error messages (e.g. `'Enter a value'` for text inputs, `'Select an option'` for radios/checkboxes) and at the end of the skill output display a clearly visible warning listing every field whose error message is a placeholder that needs replacing.

If parameter 3 was provided, look up the real error messages as follows:

1. Use Grep to search for the page slug (the filename portion of the prototype sub-path without the `.html` extension, e.g. `confirmation`) within `Path:` rows in the content markdown file, to find the matching section and its line number. Match by checking that the slug appears as the final path segment (the part after the last `/`), since the prototype folder prefix in the parameter may differ from the one used in the markdown.
2. Use Read with an offset at that line number to retrieve just that section of the file (a few dozen lines is usually enough to reach the `#### Errors` heading).
3. Look lower down that section for a 4th level markdown heading `#### Errors`. For each validation error case there will be Description, Error summary and Error message rows. The **Error message** row contains the actual error message string to use in `form-validation.js`. Map each Description to the appropriate Joi error key based on the field type rules above (e.g. "without choosing an option" → `'any.required'` for a radio; "without entering a value" → `'string.empty'` and `'any.required'` for a text input).

Where the same error message string is used more than once in a field's `.messages({})` call, extract it to a named `const` at the top of the file (outside the function) to avoid duplication. See `src/server/quote/boundary-type/form-validation.js` for an example.

### Create a form validation unit test (if the source page has a form)

Create a file called `form-validation.test.js` in the target folder. See `src/server/quote/boundary-type/form-validation.test.js` for the pattern to follow.

For each field in the schema, add tests that:

- Pass for each valid value (one test per allowed value for radios/checkboxes)
- Fail with the correct error message when the field is absent
- For radio/checkbox fields: fail with the correct error message when an unrecognised value is submitted

If the form has optional text fields, add an `optional fields` describe block with three tests: passes when all optional fields are absent, passes when all are empty strings, passes when all have values. Extract a `validRequiredData` const at the top of the file for use across tests.

Run the tests and confirm they pass.

## Create a 'get next page' file (if the source page has a form)

Create a file called `get-next-page.js` in the target folder with a default export that is a function that accepts the form payload as its argument and returns a path string, used by the controller to redirect to the next page after a successful form submit.

## Create a route file

Create a file called `routes.js` in the target folder with a default export that is an array of route definitions.

Every page will have at least a GET route. The GET route should be passed the route ID and the view model function that was created above. See `src/server/quote/start/routes.js` for the pattern to follow, except for the routePath format - for new routes it should use the format `/quote/{routeId}`.

In addition, if the source page included a form, then also create a POST route. See `src/server/quote/boundary-type/routes.js` for the pattern to follow. The route should be passed the route ID, the formValidation function, the getViewModel function and the getNextPage function.

Then, import and spread the routes into `src/server/quote/index.js` (there is an example in there to follow for the start routes)

## Create a page test

Create a test file in the target folder. See `src/server/quote/start/page.test.js` for the pattern to follow.
The first test should load the page and assert:

- the page heading (h1) is correct
- `document.title` matches the `pageTitle` value from the view model
- the Back link has the correct `href` (matching the `backLink` value from the view model)

See `src/server/quote/boundary-type/page.test.js` for an example of this pattern.

If the source page included a form, add the following tests. See `src/server/quote/boundary-type/page.test.js` for the pattern to follow:

1. A test that loads the page when validation errors are in the session cache, and asserts that the validation message from the form validation file is displayed on the page. Use the appropriate helper from `src/test-utils/assertions.js`:

- `expectFieldsetError` — for fields wrapped in a `<fieldset>` (radios and checkboxes). Pass `document` and `errorMessage`.
- `expectInputError` — for individual text/number inputs (not wrapped in a fieldset). Pass `document`, `inputLabel` (the visible label text), and `errorMessage`.

2. For fields with format validation (e.g. email inputs), add a second page load test that mocks the session cache to return an invalid error, plus the invalid value, and asserts the format error message is shown.
3. A test that submits the form with valid data and asserts that the response contains a redirect with a `location` header.
4. A test that submits the form with invalid data and asserts that the response is a redirect to the same URL, and that the validation error(s) are saved to session cache.
5. A test that confirms the form contains a hidden input to hold a CSRF token.
6. Tests checking that a user's previous form selection is remembered.
