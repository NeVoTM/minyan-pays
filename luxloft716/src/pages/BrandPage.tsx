import { Check, Copy, Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { BRAND, BRAND_ASSETS } from '../data/content'
import { BrandHeroLogo } from '../components/Logo'

const LINKS = [
  {
    label: 'Logo PNG (live site)',
    hint: 'Best for iPhone — tap, then long-press the image → Save to Photos',
    url: BRAND_ASSETS.liveLogoPng,
  },
  {
    label: 'Logo PNG (GitHub)',
    hint: 'Same file in the repo — tap to open, then save',
    url: BRAND_ASSETS.githubLogoPng,
  },
  {
    label: 'Logo SVG (live site)',
    hint: 'Vector version for print or design apps',
    url: BRAND_ASSETS.liveLogoSvg,
  },
  {
    label: 'Logo SVG (GitHub)',
    hint: 'Vector file from the repository',
    url: BRAND_ASSETS.githubLogoSvg,
  },
] as const

function CopyLinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-lux-border bg-lux-black p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-1 break-all font-mono text-xs text-lux-muted">{url}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-lux-red hover:text-lux-red-bright"
      >
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}

export function BrandPage() {
  return (
    <div>
      <section className="border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold md:text-5xl">Brand Logo</h1>
          <p className="mt-4 text-lg text-lux-muted">
            Download the official {BRAND.name} logo for your phone, social profiles, or print materials.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 lg:px-6">
        <div className="rounded-lg border border-lux-border bg-lux-elevated p-8">
          <BrandHeroLogo className="mx-auto max-w-[min(100%,360px)]" />
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={BRAND_ASSETS.liveLogoPng}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-lux-red px-6 py-4 text-sm font-semibold tracking-wide text-white uppercase hover:bg-lux-red-dark"
          >
            <ExternalLink size={18} aria-hidden />
            Open logo PNG
          </a>
          <a
            href={BRAND_ASSETS.liveLogoPng}
            download="luxe-loft-716-logo.png"
            className="inline-flex items-center justify-center gap-2 rounded-sm border-2 border-lux-red px-6 py-4 text-sm font-semibold tracking-wide text-lux-red uppercase hover:bg-lux-red hover:text-white"
          >
            <Download size={18} aria-hidden />
            Download PNG
          </a>
        </div>

        <div className="mt-10 rounded-lg border border-lux-red/30 bg-lux-red/5 p-6">
          <h2 className="text-lg font-semibold text-white">Save on iPhone</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-lux-muted">
            <li>Tap <strong className="text-white">Open logo PNG</strong> above.</li>
            <li>When the full image opens, <strong className="text-white">press and hold</strong> the logo.</li>
            <li>Choose <strong className="text-white">Add to Photos</strong> or <strong className="text-white">Save Image</strong>.</li>
          </ol>
        </div>

        <h2 className="mt-12 text-xl font-semibold">Copy &amp; paste links</h2>
        <p className="mt-2 text-sm text-lux-muted">
          Share these URLs in Messages, Notes, or email — they always point to the logo files in GitHub and on the live
          site.
        </p>
        <div className="mt-6 space-y-4">
          {LINKS.map((link) => (
            <div key={link.url}>
              <CopyLinkRow label={link.label} url={link.url} />
              <p className="mt-1 text-xs text-lux-muted">{link.hint}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
