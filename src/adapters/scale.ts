import type { LiveWeight, ScaleSource } from '@/types'

const WEIGHT_RE = /([+-]?\d+(?:\.\d+)?)\s*(kg|g|lb)?/i

export function parseScaleLine(line: string, source: ScaleSource): LiveWeight | null {
  const raw = line.trim()
  if (!raw) return null
  const match = raw.match(WEIGHT_RE)
  if (!match) return null

  const unstable = /\bUS\b/i.test(raw) || raw.includes('?')
  const stable = /\bST\b/i.test(raw) || (!unstable && !raw.toLowerCase().includes('unstable'))

  return {
    weight: Number(match[1]),
    unit: (match[2]?.toLowerCase() as LiveWeight['unit']) || 'kg',
    stable,
    raw,
    source,
  }
}
