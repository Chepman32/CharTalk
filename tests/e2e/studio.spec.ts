import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('editorial workbench simulates the production engine and blocks fixture publishing', async ({
  page,
}, testInfo) => {
  await expect(
    page.getByRole('heading', { name: 'Контент перед выпуском' }),
  ).toBeVisible()
  await expect(page.getByText('300 000 одобренных единиц')).toBeVisible()

  await page.getByRole('button', { name: 'Симулятор' }).click()
  const choices = page.locator('.sim-choices button')
  await expect(choices).toHaveCount(4)
  await choices.first().click()
  await expect(choices).toHaveCount(4)
  await choices.first().click()
  await expect(page.getByText(/Путь завершён после 2 выборов/)).toBeVisible()

  await page.getByRole('button', { name: 'Выпуск' }).first().click()
  await expect(
    page.getByRole('heading', { name: 'Выпуск пакета' }),
  ).toBeVisible()
  await expect(page.getByText('Публикация заблокирована')).toBeVisible()
  await expect(page.getByText('Узлы-решения')).toBeVisible()
  await expect(page.getByText('Ключ подписи')).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'ID ключа подписи' }),
  ).toBeVisible()
  await expect(
    page.getByRole('textbox', { name: 'Подтвердите точный ID сборки' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Подписать и выпустить' }),
  ).toBeDisabled()
  await testInfo.attach('release-gates', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
})

test('review surface compares counterfactuals and graph diagnostics', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Ревью' }).click()
  await expect(page.getByRole('heading', { name: 'Ревью' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Четыре последствия рядом' }),
  ).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(5)
  await expect(
    page.getByRole('heading', { name: 'Входящие и исходящие связи' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Повторяющиеся n-граммы' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Автоматический языковой экран' }),
  ).toBeVisible()
  await expect(
    page.getByText(
      /не заменяет независимую проверку носителями русского языка/,
    ),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Перенос на реальных ширинах' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Три грамматических профиля' }),
  ).toBeVisible()
  await expect(page.getByText('Все шаблоны разрешены').first()).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Текст отдельно от логики' }),
  ).toBeVisible()
  await page.getByRole('combobox', { name: 'Длина n-граммы' }).selectOption('2')
  await expect(page.getByText(/узлов/).first()).toBeVisible()
})

test('review surface stays within the narrow mobile viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.getByRole('button', { name: 'Ревью' }).click()
  await expect(page.getByRole('heading', { name: 'Ревью' })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test('fixture editing is saved locally without bypassing the review gate', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Контент' }).click()
  await expect(page.getByRole('heading', { name: 'Контент' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Оператор' }).fill('editor.e2e')
  await page
    .getByRole('textbox', { name: 'Причина изменения' })
    .fill('Проверить локальный редакционный след.')
  const message = page.getByRole('textbox', { name: 'Основной текст' })
  await message.fill(
    'Проверенная редакторская реплика для локального черновика.',
  )
  await page
    .getByRole('textbox', { name: 'ID намеренного повтора' })
    .first()
    .fill('repeat.e2e')
  await page.getByRole('checkbox').first().check()
  await expect(page.getByText('Черновик сохранён')).toBeVisible({
    timeout: 2_000,
  })

  await page.reload()
  await page.getByRole('button', { name: 'Контент' }).click()
  await expect(
    page.getByRole('textbox', { name: 'Основной текст' }),
  ).toHaveValue('Проверенная редакторская реплика для локального черновика.')
  await expect(
    page.getByRole('textbox', { name: 'ID намеренного повтора' }).first(),
  ).toHaveValue('repeat.e2e')
  await expect(page.getByRole('checkbox').first()).toBeChecked()
  await expect(page.getByRole('combobox', { name: 'Статус' })).toHaveValue(
    'fixture',
  )
  await expect(page.getByRole('option', { name: 'Одобрено' })).toBeDisabled()
  await expect(
    page.getByText('Проверить локальный редакционный след.').first(),
  ).toBeVisible()
  await expect(page.getByText('editor.e2e').first()).toBeVisible()
})

test('blocks a second tab from overwriting a local draft', async ({ page }) => {
  await page.getByRole('button', { name: 'Контент' }).click()
  const secondTab = await page.context().newPage()
  await secondTab.goto('/')
  await secondTab.getByRole('button', { name: 'Контент' }).click()
  await secondTab
    .getByRole('textbox', { name: 'Основной текст' })
    .fill('Изменение из второй вкладки.')

  await expect(secondTab.getByText('Черновик сохранён')).toBeVisible({
    timeout: 2_000,
  })
  await expect(page.getByRole('alert')).toContainText('другой вкладке')
  await expect(
    page.getByRole('textbox', { name: 'Основной текст' }),
  ).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Перезагрузить' }),
  ).toBeVisible()
  await secondTab.close()
})
