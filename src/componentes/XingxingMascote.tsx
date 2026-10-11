type Props = { className?: string }

export function XingxingMascote({ className = '' }: Props) {
  return (
    <img
      src="/icons/xingxing.svg"
      alt=""
      width={168}
      height={168}
      className={`h-40 w-40 ${className}`}
    />
  )
}
