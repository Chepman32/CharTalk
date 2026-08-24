import type { ContentReport } from '@razvilka/app-core'

import { secureServiceBaseUrl } from './secure-endpoint'

export const reportUploadPayload = (report: ContentReport) => ({
  reportId: report.reportId,
  runId: report.runId,
  nodeId: report.nodeId,
  choiceId: report.choiceId,
  contentBuildId: report.contentBuildId,
  appVersion: report.appVersion,
  platform: report.platform,
  diagnosticCode: report.diagnosticCode,
  category: report.category,
  note: report.note,
  consentGrantedAt: report.consentGrantedAt,
})

interface UploadOptions {
  baseUrl?: string | undefined
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
}

export async function uploadContentReport(
  report: ContentReport,
  options: UploadOptions = {},
): Promise<boolean> {
  const baseUrl = secureServiceBaseUrl(
    options.baseUrl ?? process.env.EXPO_PUBLIC_RAZVILKA_API_URL,
  )
  if (!baseUrl || !report.consentGrantedAt) return false

  try {
    const response = await (options.fetchImpl ?? fetch)(
      `${baseUrl}/v1/reports`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(reportUploadPayload(report)),
      },
    )
    return response.ok
  } catch {
    return false
  }
}
