import { getPathFromNotMatchedPage } from './not-matched-source.js'

describe('getPathFromNotMatchedPage', () => {
  it.each(['reference-not-matched', 'boundary-not-matched'])(
    'carries the %s source on the change original reference path',
    (source) => {
      expect(getPathFromNotMatchedPage(source)).toBe(
        `/request-to-use/change/original-reference?from=${source}`
      )
    }
  )
})
