import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/server'
import InputForm from '@/components/InputForm'

export default async function SubmitPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/login?redirect=/submit')
  }

  return (
    <main className="min-h-screen bg-neutral-50 py-12">
      <InputForm />
    </main>
  )
}

