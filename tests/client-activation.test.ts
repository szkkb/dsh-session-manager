import { Context } from '@deepseek-ai/cordis'
import { afterEach, expect, it, vi } from 'vitest'

vi.mock('react-dom', () => ({ createPortal: () => null }))
vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({ Button: () => null, IconTrashOutlineRegular: () => null, StateDot: () => null }))

afterEach(() => vi.unstubAllGlobals())

it('waits for Remote before activating the session manager', async () => {
  vi.stubGlobal('window', { localStorage: { getItem: () => null } })
  vi.stubGlobal('document', { createElement: () => ({}), head: { append: vi.fn() } })
  const plugin = await import('../src/client/index.ts')
  const ctx = new Context()
  const registerSlot = vi.fn()
  const errors: unknown[] = []
  ctx.on('internal/error', error => { errors.push(error) })
  ctx.reflect.provide('slots', { inject: registerSlot })
  ctx.reflect.provide('locale', {
    getLocale: () => ({ active: 'en' }), subscribe: () => () => {},
    register: () => () => {}, bind: () => () => 'Session Manager',
  })
  ctx.reflect.provide('connection', {})
  ctx.reflect.provide('sessions', { list: {
    getSnapshot: () => ({ ids: [], byId: {} }), subscribe: () => () => {},
  } })
  ctx.reflect.provide('workspaces', {})
  try {
    const fiber = ctx.plugin(plugin)
    await fiber
    expect(registerSlot).not.toHaveBeenCalled()
    expect(errors).toEqual([])
    ctx.reflect.provide('remote', { session: {} })
    await vi.waitFor(() => expect(registerSlot).toHaveBeenCalledTimes(3))
    expect(errors).toEqual([])
  } finally {
    await ctx.fiber.dispose()
  }
})
