import { describe, it, expect, vi } from 'vitest'
import { saveToSessionUnlessDropout } from './index.js'

const dropoutPage = '/quote/application-type-not-available'
const nextPage = '/quote/confirm-housing'

const buildRequest = (query) => ({ query })

const buildSave = ({ isChangeMode } = {}) => {
  const saveToSession = vi.fn((request, payload) => ({
    ...payload,
    saved: true
  }))
  const save = saveToSessionUnlessDropout({
    getNextPage: ({ planningType }) =>
      planningType === 'other' ? dropoutPage : nextPage,
    saveToSession,
    isChangeMode
  })
  return { save, saveToSession }
}

describe('saveToSessionUnlessDropout', () => {
  it('returns the payload unsaved when a change-mode submission leads to a dropout page', () => {
    const { save, saveToSession } = buildSave()
    const payload = { planningType: 'other' }

    const result = save(buildRequest({ change: 'true' }), payload)

    expect(result).toBe(payload)
    expect(saveToSession).not.toHaveBeenCalled()
  })

  it('saves when a change-mode submission leads to a normal next page', () => {
    const { save, saveToSession } = buildSave()

    const result = save(buildRequest({ change: 'true' }), {
      planningType: 'full-planning-permission'
    })

    expect(result).toEqual({
      planningType: 'full-planning-permission',
      saved: true
    })
    expect(saveToSession).toHaveBeenCalledOnce()
  })

  it('saves a dropout-leading submission that is not in change mode, keeping the forward journey unchanged', () => {
    const { save, saveToSession } = buildSave()

    const result = save(buildRequest({}), { planningType: 'other' })

    expect(result).toEqual({ planningType: 'other', saved: true })
    expect(saveToSession).toHaveBeenCalledOnce()
  })

  it('returns the payload unsaved when an overridden change-mode check says change without ?change=true', () => {
    const { save, saveToSession } = buildSave({ isChangeMode: () => true })
    const payload = { planningType: 'other' }

    const result = save(buildRequest({}), payload)

    expect(result).toBe(payload)
    expect(saveToSession).not.toHaveBeenCalled()
  })

  it('still saves an eligible submission when the change-mode check is overridden', () => {
    const { save, saveToSession } = buildSave({ isChangeMode: () => true })

    const result = save(buildRequest({}), {
      planningType: 'full-planning-permission'
    })

    expect(result).toEqual({
      planningType: 'full-planning-permission',
      saved: true
    })
    expect(saveToSession).toHaveBeenCalledOnce()
  })
})
