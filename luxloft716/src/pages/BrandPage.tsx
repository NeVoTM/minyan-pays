import { Check, Copy, Download, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { BRAND, LOGO_VARIANTS } from '../data/content'

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
    <div className="flex flex-col gap-2 rounded-lg border border-lux-border bg-lux-black p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-white">{label}</p>
        <p className="mt-1 break-all font-mono text-[11px] text-lux-muted">{url}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:border-lux-red hover:text-lux-red-bright"
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

type Variant = (typeof LOGO_VARIANTS)[number]

function LogoVariantCard({ variant }: { variant: Variant }) {
  const isSiteLogo = variant.id === 'sign'

  return (
    <article
      className={`rounded-lg border p-6 ${
        isSiteLogo ? 'border-lux-red/50 bg-lux-red/5' : 'border-lux-border bg-lux-elevated'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold text-white">{variant.name}</h2>
        <span
          className={`rounded-sm px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
            isSiteLogo ? 'bg-lux-red text-white' : 'bg-white/10 text-lux-muted'
          }`}
        >
          {variant.badge}
        </span>
      </div>
      <p className="mt-2 text-sm text-lux-muted">{variant.description}</p>

      <div className="mt-6 rounded-lg border border-lux-border bg-lux-black p-6">
        <img
          src={variant.preview}
          alt={`${BRAND.name} ${variant.name} logo`}
          className="mx-auto max-h-48 w-full max-w-sm object-contain"
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a
          href={variant.livePng}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-lux-red px-4 py-3 text-sm font-semibold tracking-wide text-white uppercase hover:bg-lux-red-dark"
        >
          <ExternalLink size={16} aria-hidden />
          Open PNG
        </a>
        <a
          href={variant.png}
          download={variant.downloadName}
          className="inline-flex items-center justify-center gap-2 rounded-sm border-2 border-lux-red px-4 py-3 text-sm font-semibold tracking-wide text-lux-red uppercase hover:bg-lux-red hover:text-white"
        >
          <Download size={16} aria-hidden />
          Download PNG
        </a>
      </div>

      <div className="mt-4 space-y-2">
        <CopyLinkRow label="PNG link (live site)" url={variant.livePng} />
        <CopyLinkRow label="PNG link (GitHub)" url={variant.githubPng} />
        {'liveSvg' in variant && variant.liveSvg ? (
          <CopyLinkRow label="SVG link (live site)" url={variant.liveSvg} />
        ) : null}
        {'githubSvg' in variant && variant.githubSvg ? (
          <CopyLinkRow label="SVG link (GitHub)" url={variant.githubSvg} />
        ) : null}
      </div>
    </article>
  )
}

export function BrandPage() {
  return (
    <div>
      <section className="border-b border-white/10 bg-lux-surface px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold md:text-5xl">Brand Logo</h1>
          <p className="mt-4 text-lg text-lux-muted">
            Two versions of the {BRAND.name} logo — pick the one you want to save or use.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 lg:px-6">
        <div className="space-y-10">
          {LOGO_VARIANTS.map((variant) => (
            <LogoVariantCard key={variant.id} variant={variant} />
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-lux-red/30 bg-lux-red/5 p-6">
          <h2 className="text-lg font-semibold text-white">How to choose a logo</h2>
          <div className="mt-4 space-y-4 text-sm text-lux-muted">
            <div>
              <p className="font-semibold text-white">Save to your iPhone</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Pick <strong className="text-white">Classic (regular X)</strong> or <strong className="text-white">Sign style</strong> above.</li>
                <li>Tap <strong className="text-white">Open PNG</strong>.</li>
                <li>Long-press the image → <strong className="text-white">Add to Photos</strong>.</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold text-white">Which logo is on the website?</p>
              <p className="mt-2">
                The live site header, footer, and favicon use <strong className="text-white">Sign style</strong>{' '}
                today. To switch the whole site to Classic (regular X), tell us and we can update it in one step.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white">Copy a link</p>
              <p className="mt-2">
                Use the <strong className="text-white">Copy</strong> buttons under each logo to paste into Messages,
                Notes, or email.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
