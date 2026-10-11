type Props = { className?: string }

export function Estrela({ className = '' }: Props) {
  return (
    <svg viewBox="0 0 24 24" className={`size-5 text-destaque ${className}`} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.4l2.4 6.5 6.9.3-5.4 4.3 1.9 6.6L12 16.7 6.2 20.1l1.9-6.6L2.7 9.2l6.9-.3L12 2.4z"
      />
    </svg>
  )
}
