import { describe, expect, it } from 'vitest'

import {
  createDownloadPauseState,
  pauseDownloadTask,
  releaseDownloadTaskAfterPause,
} from './download-resume-lifecycle'

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('download pause lifecycle', () => {
  it('persists the savable checkpoint before releasing a paused task', async () => {
    const gate = deferred<void>()
    const state = createDownloadPauseState()
    const saved: string[] = []
    let released = false
    const task = {
      pauseAsync: () => gate.promise,
      savable: () => 'resume-token',
    }

    const pause = pauseDownloadTask(state, task, token => {
      saved.push(token)
    })
    const release = releaseDownloadTaskAfterPause(state, () => {
      released = true
    })
    expect(released).toBe(false)

    gate.resolve()
    await Promise.all([pause, release])

    expect(saved).toEqual(['resume-token'])
    expect(released).toBe(true)
    expect(state.pauseRequested).toBe(true)
    expect(state.pausePromise).toBeNull()
  })

  it('coalesces concurrent background callbacks into one pause request', async () => {
    const gate = deferred<void>()
    const state = createDownloadPauseState()
    let pauseCalls = 0
    const task = {
      pauseAsync: async () => {
        pauseCalls += 1
        await gate.promise
      },
      savable: () => 'resume-token',
    }

    const first = pauseDownloadTask(state, task, () => {})
    const second = pauseDownloadTask(state, task, () => {})
    expect(pauseCalls).toBe(1)
    gate.resolve()
    await Promise.all([first, second])
    expect(pauseCalls).toBe(1)
  })

  it('clears the requested state when pausing or persisting fails', async () => {
    const state = createDownloadPauseState()
    let released = false
    const task = {
      pauseAsync: async () => {
        throw new Error('background session unavailable')
      },
      savable: () => 'resume-token',
    }

    await pauseDownloadTask(state, task, () => {})
    await releaseDownloadTaskAfterPause(state, () => {
      released = true
    })

    expect(state.pauseRequested).toBe(false)
    expect(state.pausePromise).toBeNull()
    expect(released).toBe(true)
  })
})
