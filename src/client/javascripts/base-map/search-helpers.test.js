// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  resolveSearchPlugin,
  wireSearchErrorBanner,
  wireSearchMarkerReset
} from './search-helpers.js'

describe('search-helper', () => {
  let warnSpy

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  describe('resolveSearchPlugin', () => {
    it('returns the searchPlugin function when available', () => {
      const searchPlugin = vi.fn()
      const defraApi = { searchPlugin }

      const result = resolveSearchPlugin(defraApi)

      expect(result).toBe(searchPlugin)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('returns null and logs a warning when searchPlugin is not a function', () => {
      const result = resolveSearchPlugin({ searchPlugin: undefined })

      expect(result).toBeNull()
      expect(warnSpy).toHaveBeenCalledWith(
        'Search plugin not available, location search disabled',
        ''
      )
    })
  })

  describe('wireSearchErrorBanner', () => {
    let originalFetch

    beforeEach(() => {
      originalFetch = globalThis.fetch
      delete globalThis.__searchErrorBannerRegistry
    })

    afterEach(() => {
      document.body.innerHTML = ''
      globalThis.fetch = originalFetch
      delete globalThis.__searchErrorBannerRegistry
    })

    function mountSearchContainer(containerId, { withInput = false } = {}) {
      const container = document.createElement('div')
      container.id = containerId
      const form = document.createElement('form')
      form.className = 'im-c-search-form'
      if (withInput) {
        const input = document.createElement('input')
        input.className = 'im-c-search__input'
        input.id = 'map-search'
        form.appendChild(input)
      }
      container.appendChild(form)
      document.body.appendChild(container)
      return container
    }

    function makeMap() {
      const handlers = {}
      return {
        on: vi.fn((event, cb) => {
          handlers[event] = cb
        }),
        fire: (event) => handlers[event]?.()
      }
    }

    it('shows an alert banner after a proxy request returns a non-OK response', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')

      const banner = document.querySelector('.govuk-error-message')
      expect(banner).not.toBeNull()
      expect(banner.hidden).toBe(false)
      expect(banner.getAttribute('role')).toBe('alert')
      expect(banner.getAttribute('aria-live')).toBe('polite')
      expect(banner.textContent).toContain('could not search')
    })

    it('shows the banner when the proxy request rejects (network error)', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline'))

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await expect(
        globalThis.fetch('/os-names-search?query=york')
      ).rejects.toThrow('offline')

      const banner = document.querySelector('.govuk-error-message')
      expect(banner.hidden).toBe(false)
    })

    it('hides the banner on the next successful proxy response', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 502 })
        .mockResolvedValueOnce({ ok: true, status: 200 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')
      expect(document.querySelector('.govuk-error-message').hidden).toBe(false)

      await globalThis.fetch('/os-names-search?query=york')
      expect(document.querySelector('.govuk-error-message').hidden).toBe(true)
    })

    it('ignores non-search fetch calls', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/some/other/endpoint')

      const banner = document.querySelector('.govuk-error-message')
      expect(banner.hidden).toBe(true)
    })

    it('recognises the { url, options } shape used by the search plugin', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch({
        url: '/os-names-search?query=york',
        options: {}
      })

      expect(document.querySelector('.govuk-error-message').hidden).toBe(false)
    })

    it('does not stack watchers on repeat calls', () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      const firstPatched = globalThis.fetch
      wireSearchErrorBanner(map, 'test-map')
      expect(globalThis.fetch).toBe(firstPatched)
    })

    it('shows the banner on the active map when more than one searchable map exists', async () => {
      const first = mountSearchContainer('first-map', { withInput: true })
      const second = mountSearchContainer('second-map', { withInput: true })
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 })

      const firstMap = makeMap()
      const secondMap = makeMap()
      wireSearchErrorBanner(firstMap, 'first-map')
      wireSearchErrorBanner(secondMap, 'second-map')
      firstMap.fire('app:ready')
      secondMap.fire('app:ready')

      second.querySelector('.im-c-search__input').focus()
      await globalThis.fetch('/os-names-search?query=york')

      expect(first.querySelector('.govuk-error-message').hidden).toBe(true)
      expect(second.querySelector('.govuk-error-message').hidden).toBe(false)
    })

    it('reuses the current registry when a second map is initialised later', async () => {
      const first = mountSearchContainer('first-map', { withInput: true })
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 })

      const firstMap = makeMap()
      wireSearchErrorBanner(firstMap, 'first-map')
      firstMap.fire('app:ready')

      const second = mountSearchContainer('second-map', { withInput: true })
      const secondMap = makeMap()
      wireSearchErrorBanner(secondMap, 'second-map')
      secondMap.fire('app:ready')

      second.querySelector('.im-c-search__input').focus()
      await globalThis.fetch('/os-names-search?query=york')

      expect(first.querySelector('.govuk-error-message').hidden).toBe(true)
      expect(second.querySelector('.govuk-error-message').hidden).toBe(false)
    })

    it('accepts a custom error message', async () => {
      mountSearchContainer('test-map')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map', 'Something went wrong')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')

      expect(document.querySelector('.govuk-error-message').textContent).toBe(
        'Something went wrong'
      )
    })

    it('links the search input to the banner via aria-describedby on error', async () => {
      mountSearchContainer('test-map', { withInput: true })
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 502 })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')

      const input = document.querySelector('.im-c-search__input')
      const banner = document.querySelector('.govuk-error-message')
      expect(banner.id).toBe('app-c-search-error')
      expect(input.getAttribute('aria-describedby')).toBe('app-c-search-error')
    })

    it('removes aria-describedby once a subsequent request succeeds', async () => {
      mountSearchContainer('test-map', { withInput: true })
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')
      await globalThis.fetch('/os-names-search?query=york')

      const input = document.querySelector('.im-c-search__input')
      expect(input.hasAttribute('aria-describedby')).toBe(false)
    })

    it('preserves pre-existing aria-describedby ids when linking the banner', async () => {
      const container = mountSearchContainer('test-map', { withInput: true })
      const input = container.querySelector('.im-c-search__input')
      input.setAttribute('aria-describedby', 'other-hint')
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false })

      const map = makeMap()
      wireSearchErrorBanner(map, 'test-map')
      map.fire('app:ready')

      await globalThis.fetch('/os-names-search?query=york')

      expect(input.getAttribute('aria-describedby')).toBe(
        'other-hint app-c-search-error'
      )
    })
  })

  describe('wireSearchMarkerReset', () => {
    afterEach(() => {
      document.body.innerHTML = ''
    })

    function mountSearchContainer(containerId) {
      const container = document.createElement('div')
      container.id = containerId
      container.innerHTML = `
        <form class="im-c-search-form">
          <input class="im-c-search__input" id="map-search" />
        </form>
      `
      document.body.appendChild(container)
      return container
    }

    function makeMap() {
      const handlers = {}
      return {
        on: vi.fn((event, cb) => {
          handlers[event] = cb
        }),
        fire: (event, payload) => handlers[event]?.(payload)
      }
    }

    function waitForMarkerReset() {
      return new Promise((resolve) => setTimeout(resolve, 0))
    }

    it('removes the active search marker when the user empties the input', async () => {
      mountSearchContainer('test-map')
      const remove = vi.fn()
      const map = makeMap()

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready', {
        mapProvider: {
          markers: { remove }
        }
      })
      map.fire('search:match', { query: 'York' })

      const input = document.querySelector('.im-c-search__input')
      input.value = ''
      input.dispatchEvent(new window.InputEvent('input', { bubbles: true }))

      await waitForMarkerReset()

      expect(remove).toHaveBeenCalledWith('search')
    })

    it('removes the marker through the map API when app:ready has no payload', async () => {
      mountSearchContainer('test-map')
      const removeMarker = vi.fn()
      const map = {
        ...makeMap(),
        removeMarker
      }

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready')
      map.fire('search:match', { query: 'York' })

      const input = document.querySelector('.im-c-search__input')
      input.value = ''
      input.dispatchEvent(new window.InputEvent('input', { bubbles: true }))

      await waitForMarkerReset()

      expect(removeMarker).toHaveBeenCalledWith('search')
    })

    it('removes the active search marker when the user deletes a character', async () => {
      mountSearchContainer('test-map')
      const remove = vi.fn()
      const map = makeMap()

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready', {
        mapProvider: {
          markers: { remove }
        }
      })
      map.fire('search:match', { query: 'York' })

      const input = document.querySelector('.im-c-search__input')
      input.value = 'Yor'
      input.dispatchEvent(new window.InputEvent('input', { bubbles: true }))

      await waitForMarkerReset()

      expect(remove).toHaveBeenCalledWith('search')
    })

    it('waits until the input event has propagated before removing the marker', async () => {
      const container = mountSearchContainer('test-map')
      const remove = vi.fn()
      const map = makeMap()
      const removeCallsDuringInput = []

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready', {
        mapProvider: {
          markers: { remove }
        }
      })
      map.fire('search:match', { query: 'York' })

      container.addEventListener('input', () => {
        removeCallsDuringInput.push(remove.mock.calls.length)
      })

      const input = document.querySelector('.im-c-search__input')
      input.value = 'Yor'
      input.dispatchEvent(new window.InputEvent('input', { bubbles: true }))

      expect(removeCallsDuringInput).toEqual([0])

      await waitForMarkerReset()

      expect(remove).toHaveBeenCalledWith('search')
    })

    it('waits until input microtasks have run before removing the marker', async () => {
      const container = mountSearchContainer('test-map')
      let pluginHandledInput = false
      const remove = vi.fn(() => {
        expect(pluginHandledInput).toBe(true)
      })
      const map = makeMap()

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready', {
        mapProvider: {
          markers: { remove }
        }
      })
      map.fire('search:match', { query: 'York' })

      container.addEventListener('input', () => {
        Promise.resolve().then(() => {
          pluginHandledInput = true
        })
      })

      const input = document.querySelector('.im-c-search__input')
      input.value = ''
      input.dispatchEvent(new window.InputEvent('input', { bubbles: true }))

      await waitForMarkerReset()

      expect(remove).toHaveBeenCalledWith('search')
    })

    it('keeps the marker when the user appends characters to an existing match', () => {
      mountSearchContainer('test-map')
      const remove = vi.fn()
      const map = makeMap()

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready', {
        mapProvider: {
          markers: { remove }
        }
      })
      map.fire('search:match', { query: 'York' })

      const input = document.querySelector('.im-c-search__input')
      input.value = 'Yorks'
      input.dispatchEvent(new window.InputEvent('input', { bubbles: true }))

      expect(remove).not.toHaveBeenCalled()
    })

    it('removes the active search marker when the user replaces the matched query', async () => {
      mountSearchContainer('test-map')
      const remove = vi.fn()
      const map = makeMap()

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready', {
        mapProvider: {
          markers: { remove }
        }
      })
      map.fire('search:match', { query: 'York' })

      const input = document.querySelector('.im-c-search__input')
      input.value = 'Leeds'
      input.dispatchEvent(new window.InputEvent('input', { bubbles: true }))

      await waitForMarkerReset()

      expect(remove).toHaveBeenCalledWith('search')
    })

    it('does not remove the marker before any result has been selected', () => {
      mountSearchContainer('test-map')
      const remove = vi.fn()
      const map = makeMap()

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready', {
        mapProvider: {
          markers: { remove }
        }
      })

      const input = document.querySelector('.im-c-search__input')
      input.value = ''
      input.dispatchEvent(new window.InputEvent('input', { bubbles: true }))

      expect(remove).not.toHaveBeenCalled()
    })

    it('resets its active state when the plugin emits search:clear', () => {
      mountSearchContainer('test-map')
      const remove = vi.fn()
      const map = makeMap()

      wireSearchMarkerReset(map, 'test-map')
      map.fire('app:ready', {
        mapProvider: {
          markers: { remove }
        }
      })
      map.fire('search:match', { query: 'York' })
      map.fire('search:clear')

      const input = document.querySelector('.im-c-search__input')
      input.value = 'Leeds'
      input.dispatchEvent(new Event('input', { bubbles: true }))

      expect(remove).not.toHaveBeenCalled()
    })

    it('binds the input listener via MutationObserver when the input mounts after app:ready', async () => {
      const container = document.createElement('div')
      container.id = 'lazy-marker-map'
      document.body.appendChild(container)
      const remove = vi.fn()
      const map = makeMap()

      wireSearchMarkerReset(map, 'lazy-marker-map')
      map.fire('app:ready', { mapProvider: { markers: { remove } } })

      const input = document.createElement('input')
      input.className = 'im-c-search__input'
      container.appendChild(input)

      await new Promise((resolve) => setTimeout(resolve, 0))

      map.fire('search:match', { query: 'York' })
      input.dispatchEvent(new Event('input', { bubbles: true }))

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(remove).toHaveBeenCalledWith('search')
    })

    it('is a no-op on app:ready when the map container does not exist', () => {
      const map = makeMap()
      wireSearchMarkerReset(map, 'does-not-exist')
      expect(() =>
        map.fire('app:ready', { mapProvider: { markers: { remove: vi.fn() } } })
      ).not.toThrow()
    })

    it('does not call removeSearchMarker when event has no mapProvider', () => {
      const container = document.createElement('div')
      container.id = 'no-provider-map'
      const input = document.createElement('input')
      input.className = 'im-c-search__input'
      container.appendChild(input)
      document.body.appendChild(container)
      const map = makeMap()

      wireSearchMarkerReset(map, 'no-provider-map')
      map.fire('app:ready', {})
      map.fire('search:match', { query: 'York' })

      expect(() =>
        input.dispatchEvent(new Event('input', { bubbles: true }))
      ).not.toThrow()
    })
  })
})
