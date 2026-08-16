export interface DownloadPauseState {
  pauseRequested: boolean
  pausePromise: Promise<void> | null
}

export interface PauseableDownloadTask<SavableTask> {
  pauseAsync(): Promise<void>
  savable(): SavableTask
}

export function createDownloadPauseState(): DownloadPauseState {
  return { pauseRequested: false, pausePromise: null }
}

export async function pauseDownloadTask<SavableTask>(
  state: DownloadPauseState,
  task: PauseableDownloadTask<SavableTask>,
  persist: (savableTask: SavableTask) => Promise<void> | void,
): Promise<void> {
  if (state.pausePromise) {
    await state.pausePromise
    return
  }

  state.pauseRequested = true
  const pending = (async () => {
    try {
      await task.pauseAsync()
      await persist(task.savable())
    } catch {
      state.pauseRequested = false
    }
  })()
  state.pausePromise = pending

  try {
    await pending
  } finally {
    if (state.pausePromise === pending) state.pausePromise = null
  }
}

export async function releaseDownloadTaskAfterPause(
  state: DownloadPauseState,
  release: () => void,
): Promise<void> {
  const pending = state.pausePromise
  if (pending) await pending
  release()
}
