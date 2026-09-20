import { redirect } from "next/navigation"
import { Wordmark } from "@/components/brand"
import { currentAdmin } from "@/lib/auth"
import { LoginForm } from "./form"

export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin")
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Wordmark /></div>
        <div className="card p-6 sm:p-8">
          <h1 className="mb-5 text-xl font-extrabold">Admin sign in</h1>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
