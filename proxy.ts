import { NextResponse, type NextRequest } from "next/server"

const LOCALES = ["uz", "ru", "en"]
const COOKIE = "unirank_locale"

function pickLocale(request: NextRequest) {
  const saved = request.cookies.get(COOKIE)?.value
  if (saved && LOCALES.includes(saved)) return saved
  const accepted = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
  return accepted.find((l) => LOCALES.includes(l)) ?? "uz"
}

// Public pages live under /uz, /ru, /en. Anything else that reaches here is a
// bare path ("/", "/u/tuit") and is sent to the visitor's language.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const first = pathname.split("/")[1]
  if (LOCALES.includes(first)) {
    const response = NextResponse.next()
    if (request.cookies.get(COOKIE)?.value !== first)
      response.cookies.set(COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" })
    return response
  }
  const url = request.nextUrl.clone()
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next|api|admin|pay|logo|.*\\..*).*)"],
}
