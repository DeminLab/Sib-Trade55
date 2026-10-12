import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })
  const secure = process.env.AUTH_COOKIE_SECURE === 'true' || (process.env.AUTH_COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production')
  response.cookies.set("sib_trade_session", "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 })
  return response
}
