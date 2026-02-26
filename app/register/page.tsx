import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import AuthOptions from '@/lib/auth';
import RegisterForm from '@/components/auth/RegisterForm';

export default async function RegisterPage() {
  const session = await getServerSession(AuthOptions);

  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-2">Créer un compte</h1>
        <p className="text-slate-600 mb-8">Inscrivez-vous pour commencer à acheter</p>
        <RegisterForm />
      </div>
    </div>
  );
}
