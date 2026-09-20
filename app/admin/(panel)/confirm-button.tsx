"use client"

/** A submit button that asks first. For actions that move POWER or cannot be undone from the UI. */
export function ConfirmButton({ message, className, children, ...rest }: { message: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault() }}>
      {children}
    </button>
  )
}
