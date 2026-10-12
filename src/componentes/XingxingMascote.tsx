type Props = { className?: string }

export function XingxingMascote({ className = '' }: Props) {
  return (
    <img
      src="/icons/xingxing.svg?v=2"
      alt=""
      width={168}
      height={168}
      className={`h-40 w-40 ${className}`}
    />
  )
}
