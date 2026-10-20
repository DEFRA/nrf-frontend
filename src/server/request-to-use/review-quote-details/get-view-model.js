import { getPageTitle } from '../../common/helpers/page-title.js'
import { planningTypeOptions } from '../../quote/planning-type/options.js'
import { housingOptions } from '../../quote/confirm-housing/options.js'

/**
 * Change actions are placeholders: the edit quote journey will give each row
 * a real target.
 * @param {string} visuallyHiddenText - row name announced to screen readers
 * @returns {object} summary list actions for one row
 */
const changeAction = (visuallyHiddenText) => ({
  items: [{ href: '#', text: 'Change', visuallyHiddenText }]
})

/**
 * Red line boundary answer by boundary entry type. boundaryFilename is
 * user-controlled: it only ever flows into value.text, which govukSummaryList
 * escapes (value.html would not be).
 * @param {object} data - the quote session data
 * @returns {{text: string, visuallyHiddenText: string}} the row value and the change link hidden text
 */
const boundaryAnswer = (data) => {
  if (data?.boundaryEntryType === 'upload') {
    return {
      text: data?.boundaryFilename || 'Uploaded',
      visuallyHiddenText: 'uploaded red line boundary'
    }
  }

  return {
    text: data?.boundaryEntryType === 'draw' ? 'Added' : 'Not added',
    visuallyHiddenText: 'red line boundary'
  }
}

/**
 * @param {object} [data] - the quote session data saved when the quote was
 * created, merged with the NRL reference from the request to use session
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the review and amend the quote details page
 */
export default function getViewModel(data = {}, _query = {}) {
  const pageHeading = `Review and amend the quote details for ${data?.nrlReference}`
  const boundary = boundaryAnswer(data)

  const rows = [
    {
      key: { text: 'Planning permission type' },
      value: {
        text: planningTypeOptions.find(
          (option) => option.value === data?.planningType
        )?.text
      },
      actions: changeAction('planning permission type')
    },
    {
      key: { text: 'Housing' },
      value: {
        text: housingOptions.find((option) => option.value === data?.isHousing)
          ?.text
      },
      actions: changeAction('whether you are developing housing')
    },
    // Housing units only apply when the development has housing.
    ...(data?.isHousing === 'yes'
      ? [
          {
            key: { text: 'Number of housing units' },
            value: { text: data?.housingUnits },
            actions: changeAction('number of housing units')
          }
        ]
      : []),
    {
      key: { text: 'Red line boundary' },
      value: { text: boundary.text },
      actions: changeAction(boundary.visuallyHiddenText)
    },
    // No change action: the email address cannot be changed from this page.
    {
      key: { text: 'Email address' },
      value: { text: data?.email }
    }
  ].filter((row) => row.value.text != null)

  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    rows
  }
}
