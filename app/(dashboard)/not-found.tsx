import Link from "next/link"

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold font-display text-[--color-on-surface] tracking-tight">
          404
        </h1>
        <p className="mt-4 text-lg text-[--color-on-surface-variant]">
          Page not found
        </p>
        <p className="mt-2 text-sm text-[--color-on-surface-variant]">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[--color-primary] px-6 py-3 font-semibold text-[--color-on-primary] transition-opacity hover:opacity-90"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
