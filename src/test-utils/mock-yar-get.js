/**
 * Makes a mocked request's yar.get return the given values by key.
 * @param {{ yar: { get: import('vitest').Mock } }} request
 * @param {Record<string, unknown>} values
 */
export const mockYarGet = (request, values) =>
  request.yar.get.mockImplementation((key) => values[key])
