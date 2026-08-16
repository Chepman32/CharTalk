import { expect, test, type Page, type TestInfo } from '@playwright/test'

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1)
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1)
}

async function attachScreen(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
}

async function finishOnboarding(page: Page) {
  await expect(
    page.getByText('Это вымышленная авторская история.'),
  ).toBeVisible()
  await expect(page.getByText(/не живой человек и не ИИ-чат/)).toBeVisible()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByRole('textbox', { name: 'Ваше имя' }).fill('Саша')
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await page.getByRole('button', { name: 'Открыть истории' }).click()
  await expect(page.getByText('Добрый вечер, Саша.')).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('onboarding-screen')).toBeVisible({
    timeout: 30_000,
  })
})

test('reader can skip optional personalization and open the catalog', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Начать сразу' }).click()

  await expect(page.getByText('Добрый вечер, Читатель.')).toBeVisible()
  await expect(page.getByText('243 истории уже встроены')).toBeVisible()
  await expect(
    page.getByRole('button', { name: /После дедлайна\. Ира.*драма/ }),
  ).toBeVisible()
})

test('onboarding actions remain fully reachable at the small viewport', async ({
  page,
}) => {
  const continueButton = page.getByRole('button', { name: 'Продолжить' })
  await expect(continueButton).toBeVisible()
  await continueButton.scrollIntoViewIfNeeded()
  const box = await continueButton.boundingBox()
  const viewport = page.viewportSize()

  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  if (box && viewport) {
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
  }
})

test('downloads reports the built-in package size without a download step', async ({
  page,
}) => {
  await finishOnboarding(page)

  await page.goto('/downloads')
  await expect(
    page.getByRole('heading', { name: 'Обновления' }).first(),
  ).toBeVisible()
  await expect(
    page.getByText('встроенный контент · размер локальных пакетов'),
  ).toBeVisible()
  await expect(page.getByText(/\d+(?:,\d+)? МБ/).first()).toBeVisible()
  await expect(page.getByText('0 Б')).toHaveCount(0)
})

test('guest reader completes an offline-authored path with four choices and undo', async ({
  page,
}, testInfo) => {
  await finishOnboarding(page)

  await expectNoHorizontalOverflow(page)
  await attachScreen(page, testInfo, 'catalog')
  await page.context().setOffline(true)
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false)

  await page.getByRole('button', { name: /После дедлайна\. Ира/ }).click()
  await expect(page.getByText(/не живой собеседник и не ИИ-чат/)).toBeVisible()
  await page.getByRole('button', { name: 'Начать историю' }).click()
  const attachmentMessage = page.getByLabel(
    /Ира: На столе лежат старая записка, ключ на синей ленте и билет/,
  )
  await expect(attachmentMessage).toBeVisible()
  await expect(attachmentMessage).not.toHaveAttribute('aria-label', /\.\./)

  let choices = page.getByRole('button', { name: /^Вариант [1-4] из 4:/ })
  await expect(choices).toHaveCount(4)
  await expect(choices.nth(3)).toBeVisible()
  await choices.first().click()
  await expect(
    page.getByRole('button', { name: 'Отменить выбор' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Отменить выбор' }).click()
  await expect(choices).toHaveCount(4)

  await choices.first().click()
  await page.getByRole('button', { name: 'Отправить сейчас' }).click()
  choices = page.getByRole('button', { name: /^Вариант [1-4] из 4:/ })
  await expect(choices).toHaveCount(4)
  await choices.first().click()
  await page.getByRole('button', { name: 'Отправить сейчас' }).click()

  await expect(page.getByRole('heading', { name: 'Итог' })).toBeVisible()
  await expect(page.getByText('История запомнила 2 выбора.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Пройти иначе' })).toBeVisible()

  await expect(
    page.getByRole('button', { name: 'Посмотреть развилки' }),
  ).toHaveCount(0)

  await page.getByRole('button', { name: 'К другим историям' }).click()
  await expect(
    page.getByRole('button', { name: /После дедлайна · 1 прохождение/ }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: /После дедлайна · 1 прохождение/ })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Развилки · После дедлайна' }),
  ).toBeVisible()
  await expect(page.getByText('1 прохождение', { exact: true }).last()).toBeVisible()
  await expect(page.getByLabel(/Выбран вариант [1-4]/).first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await attachScreen(page, testInfo, 'branches')

  await page
    .getByRole('button', { name: /переиграть/ })
    .first()
    .click()
  await expect(
    page.getByRole('button', { name: /^Вариант [1-4] из 4:/ }),
  ).toHaveCount(4)
})

test('archive keeps offline status and the latest authored line visible', async ({
  page,
}) => {
  await finishOnboarding(page)

  await page.getByRole('button', { name: /После дедлайна\. Ира/ }).click()
  await page.getByRole('button', { name: 'Начать историю' }).click()
  for (let step = 0; step < 2; step += 1) {
    await page.getByRole('button', { name: /^Вариант 1 из 4:/ }).click()
    await page.getByRole('button', { name: 'Отправить сейчас' }).click()
  }
  await expect(page.getByRole('heading', { name: 'Итог' })).toBeVisible()

  await page.goto('/archive')
  await expect(page.getByRole('heading', { name: 'Прохождения' })).toBeVisible()
  await expect(page.getByText('Офлайн')).toBeVisible()
  await expect(page.getByText(/^«.+»$/)).toBeVisible()
})

test('content report cannot be sent until its exact metadata is accepted', async ({
  page,
}) => {
  await finishOnboarding(page)
  await page.goto('/report')

  const submit = page.getByRole('button', { name: 'Отправить отчёт' })
  await expect(submit).toBeDisabled()
  await page
    .getByRole('checkbox', {
      name: 'Разрешаю отправить перечисленные данные для этого отчёта.',
    })
    .check()
  await expect(submit).toBeEnabled()
  await submit.click()
  await expect(
    page.getByText(/Отчёт сохранён в очереди|Отчёт отправлен/),
  ).toBeVisible()
})

test('story detail exposes offline status and resumes the active run', async ({
  page,
}) => {
  await finishOnboarding(page)

  await page.getByRole('button', { name: /После дедлайна\. Ира/ }).click()
  await expect(page.getByText('Доступно офлайн')).toBeVisible()
  await expect(
    page.getByText(/Встроено в пакет · \d+(?:,\d+)? КБ/),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Начать историю' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Открыть профиль персонажа Ира' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Открыть профиль персонажа Ира' })
    .click()
  await expect(page.getByRole('heading', { name: 'Ира' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: /После дедлайна\. Ира/ }),
  ).toBeVisible()
  await page.goBack()
  await expect(page.getByText('Доступно офлайн')).toBeVisible()

  await page.getByRole('button', { name: 'Начать историю' }).click()
  await expect(
    page.getByRole('button', { name: /^Вариант 1 из 4:/ }),
  ).toBeVisible()

  await page.goto('/story/story.ira.after-deadline')
  await expect(
    page.getByRole('button', { name: 'Продолжить историю' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Продолжить историю' }).click()
  await expect(
    page.getByRole('button', { name: /^Вариант 1 из 4:/ }),
  ).toBeVisible()
})

test('PDS deep links resolve to the canonical reader surfaces', async ({
  page,
}) => {
  await finishOnboarding(page)

  await page.getByRole('button', { name: /После дедлайна\. Ира/ }).click()
  await page.getByRole('button', { name: 'Начать историю' }).click()
  const runId = new URL(page.url()).pathname.split('/').pop()
  expect(runId).toBeTruthy()

  await page.goto(`/story/story.ira.after-deadline/run/${runId}`)
  await expect(
    page.getByRole('button', { name: /^Вариант 1 из 4:/ }),
  ).toBeVisible()

  await page.goto(`/story/story.asya.seven-minutes/run/${runId}`)
  await expect(page.getByText('Добрый вечер, Саша.')).toBeVisible()

  await page.goto(`/story/story.ira.after-deadline/run/${runId}/branches`)
  await expect(
    page.getByRole('heading', { name: 'Развилки · После дедлайна' }),
  ).toBeVisible()

  await page.goto(`/run/${runId}`)
  for (let step = 0; step < 2; step += 1) {
    await page.getByRole('button', { name: /^Вариант 1 из 4:/ }).click()
    await page.getByRole('button', { name: 'Отправить сейчас' }).click()
  }
  await expect(
    page.getByRole('heading', { name: 'Итог', exact: true }),
  ).toBeVisible()

  await page.goto(`/story/story.ira.after-deadline/run/${runId}/recap`)
  await expect(
    page.getByRole('heading', { name: 'Итог', exact: true }),
  ).toBeVisible()

  await page.goto('/support/report')
  await expect(
    page.getByRole('heading', { name: 'Что пошло не так?' }),
  ).toBeVisible()

  await page.goto('/account')
  await expect(page.getByText('Локальный профиль')).toBeVisible()
})

test('a bundled bulk story opens offline without a download step', async ({
  page,
}) => {
  await finishOnboarding(page)

  const bulkCard = page.getByRole('button', {
    name: /Ночная смена — После последнего звонка/,
  })
  await expect(bulkCard).toBeVisible()
  await expect(bulkCard).toHaveAccessibleName(/Доступно офлайн\./)

  await page.context().setOffline(true)
  await bulkCard.click()
  await expect(page.getByText('Доступно офлайн')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Скачать историю' }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Начать историю' }).click()
  await expect(
    page.getByRole('button', { name: /^Вариант 1 из 4:/ }),
  ).toBeVisible()
})

test('bundled catalog remains usable when offline before opening the catalog', async ({
  page,
}) => {
  await page.context().setOffline(true)
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false)

  await page.getByRole('button', { name: 'Начать сразу' }).click()
  await expect(page.getByText('Добрый вечер, Читатель.')).toBeVisible()
  await expect(page.getByText('243 истории уже встроены')).toBeVisible()

  const bulkCard = page.getByRole('button', {
    name: /Ночная смена — После последнего звонка/,
  })
  await expect(bulkCard).toHaveAccessibleName(/Доступно офлайн\./)
  await bulkCard.click()
  await expect(page.getByText('Доступно офлайн')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Скачать историю' }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Начать историю' }).click()
  await expect(
    page.getByRole('button', { name: /^Вариант 1 из 4:/ }),
  ).toBeVisible()
})

test('a newer cached catalog never gates an already bundled story', async ({
  page,
}) => {
  await finishOnboarding(page)

  await page.evaluate(() => {
    localStorage.setItem(
      'chartalk.catalog.cache.v1',
      JSON.stringify({
        data: {
          packId: 'pack.sample',
          locale: 'ru-RU',
          buildId: 'remote-catalog-build',
          contentVersion: '9.0.0',
          checksum: 'sha256:remote-catalog',
          characters: [],
          stories: [],
          episodes: [],
          warnings: [],
        },
        etag: 'remote-etag',
        fetchedAt: new Date().toISOString(),
      }),
    )
  })
  await page.reload()
  await expect(page.getByText(/истории уже встроены/)).toBeVisible()
  await page.goto('/story/story.ira.after-deadline')
  await expect(page.getByText('Доступно офлайн')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Скачать историю' }),
  ).toHaveCount(0)
})

test('catalog search and appearance preference survive navigation and reload', async ({
  page,
}, testInfo) => {
  await finishOnboarding(page)

  const search = page.getByRole('textbox', {
    name: 'Поиск по персонажам и историям',
  })
  await search.fill('Ася')
  await expect(
    page.getByRole('button', { name: /Семь минут\. Ася/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /После дедлайна\. Ира/ }),
  ).toHaveCount(0)
  await expect(page.getByText('Найдено: 1')).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await attachScreen(page, testInfo, 'filtered-catalog')

  await page.goto('/settings')
  await page.getByRole('button', { name: 'Экспортировать данные' }).click()
  await expect(
    page.getByText('Экспорт подготовлен в формате JSON.'),
  ).toBeVisible()

  await page.goto('/appearance')
  const mono = page.getByRole('radio', { name: /Моно/ })
  await mono.click()
  await expect(mono).toBeChecked()
  await expectNoHorizontalOverflow(page)
  await attachScreen(page, testInfo, 'mono-theme')

  await page.reload()
  await expect(page.getByRole('radio', { name: /Моно/ })).toBeChecked()
})

test('high-intensity story offers and completes its authored safe route', async ({
  page,
}, testInfo) => {
  await finishOnboarding(page)

  await page.getByRole('button', { name: /Три удара\. Дина/ }).click()
  await expect(
    page.getByText('Тревожная ночная сцена в пустом доме.'),
  ).toBeVisible()
  const warningToggle = page.getByRole('button', {
    name: 'Предупреждение: Тревожная ночная сцена в пустом доме.',
  })
  await warningToggle.click()
  await expect(
    page.getByText(
      'Есть напряжённое ожидание неизвестного звука. Нет графического насилия, погони или скримеров.',
    ),
  ).toBeHidden()
  await warningToggle.click()
  await expect(
    page.getByText(
      'Есть напряжённое ожидание неизвестного звука. Нет графического насилия, погони или скримеров.',
    ),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Начать без этой сцены' }),
  ).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await attachScreen(page, testInfo, 'safe-route-warning')

  await page.getByRole('button', { name: 'Начать без этой сцены' }).click()
  await expect(page.getByRole('heading', { name: 'Итог' })).toBeVisible()
  await expect(page.getByText('История запомнила 0 выборов.')).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('200% text and reduced motion preserve all four ordered choices', async ({
  page,
}, testInfo) => {
  await finishOnboarding(page)

  await page.goto('/settings')
  await page.getByRole('button', { name: /Размер текста/ }).click()
  const extraLarge = page.getByRole('radio', { name: /200%/ })
  await extraLarge.click()
  await expect(extraLarge).toBeChecked()
  await expectNoHorizontalOverflow(page)
  await attachScreen(page, testInfo, 'text-200-percent')

  await page.reload()
  await expect(page.getByRole('radio', { name: /200%/ })).toBeChecked()
  await page.goto('/settings')
  const reducedMotion = page
    .getByRole('switch', { name: /Меньше движения/ })
    .first()
  if (!(await reducedMotion.isChecked())) await reducedMotion.click()
  await expect(reducedMotion).toBeChecked()

  await page.goto('/')
  await page.getByRole('button', { name: /После дедлайна\. Ира/ }).click()
  await page.getByRole('button', { name: 'Начать историю' }).click()

  let choices = page.getByRole('button', { name: /^Вариант [1-4] из 4:/ })
  await expect(choices).toHaveCount(4)
  expect(
    await choices.evaluateAll(nodes =>
      nodes.map(
        node => node.getAttribute('aria-label')?.match(/Вариант (\d)/)?.[1],
      ),
    ),
  ).toEqual(['1', '2', '3', '4'])
  await choices.first().focus()
  await page.keyboard.press('Tab')
  await expect(choices.nth(1)).toBeFocused()
  await choices.last().scrollIntoViewIfNeeded()
  await expect(choices.last()).toBeVisible()
  await expectNoHorizontalOverflow(page)
  const transcriptBox = await page.getByTestId('run-transcript').boundingBox()
  const composerBox = await page.getByTestId('run-composer').boundingBox()
  expect(transcriptBox).not.toBeNull()
  expect(composerBox).not.toBeNull()
  if (transcriptBox && composerBox) {
    expect(transcriptBox.y + transcriptBox.height).toBeLessThanOrEqual(
      composerBox.y + 1,
    )
  }
  await attachScreen(page, testInfo, 'four-choices-text-200-percent')

  await choices.last().click()
  await expect(
    page.getByRole('button', { name: 'Отменить выбор' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Отменить выбор' }).click()
  choices = page.getByRole('button', { name: /^Вариант [1-4] из 4:/ })
  await expect(choices).toHaveCount(4)
})
