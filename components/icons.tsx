import type { SVGProps } from "react"

type P = SVGProps<SVGSVGElement>
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const

export const Bolt = (p: P) => (<svg {...base} fill="currentColor" stroke="none" {...p}><path d="M13.2 2 4.5 13.4a.6.6 0 0 0 .5 1h5.3l-1.1 7.1c-.1.6.7 1 1.1.5l8.7-11.4a.6.6 0 0 0-.5-1h-5.3l1.1-7.1c.1-.6-.7-1-1.1-.5Z" /></svg>)
export const Search = (p: P) => (<svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>)
export const ArrowUp = (p: P) => (<svg {...base} {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>)
export const ArrowDown = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12l7 7 7-7" /></svg>)
export const ArrowRight = (p: P) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>)
export const ArrowLeft = (p: P) => (<svg {...base} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>)
export const Plus = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>)
export const Minus = (p: P) => (<svg {...base} {...p}><path d="M5 12h14" /></svg>)
export const Close = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>)
export const Check = (p: P) => (<svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>)
export const Globe = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></svg>)
export const External = (p: P) => (<svg {...base} {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>)
export const Copy = (p: P) => (<svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>)
export const Telegram = (p: P) => (<svg {...base} fill="currentColor" stroke="none" {...p}><path d="M21.4 4.2 2.9 11.3c-.8.3-.8 1.4 0 1.7l4.6 1.5 1.8 5.6c.2.6 1 .8 1.4.3l2.6-2.7 4.6 3.4c.5.4 1.3.1 1.4-.6l3-15.2c.2-.8-.6-1.4-1.3-1.100ZM9.8 14.100l8-6.3-6.2 7.3-.3 3.2-1.5-4.200Z" /></svg>)
export const Clock = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
export const Alert = (p: P) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.500v5M12 16.500h.01" /></svg>)
