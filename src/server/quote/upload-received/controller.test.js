import { describe, it, expect, vi } from 'vitest'
import { handler } from './controller.js'

describe('upload-received controller', () => {
  it('should return view with correct pageTitle and pageHeading', () => {
    const h = {
      view: vi.fn().mockReturnValue({
        header: vi.fn().mockReturnThis()
      })
    }
    const request = {}

    handler(request, h)

    expect(h.view).toHaveBeenCalledWith('quote/upload-received/index', {
      pageTitle: 'File uploaded - Nature Restoration Fund - Gov.uk',
      pageHeading: 'TODO: implement file upload status page'
    })
  })

  it('should set Cache-Control header to no-store, must-revalidate', () => {
    const headerMock = vi.fn().mockReturnThis()
    const h = {
      view: vi.fn().mockReturnValue({
        header: headerMock
      })
    }
    const request = {}

    handler(request, h)

    expect(headerMock).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, must-revalidate'
    )
  })
})
