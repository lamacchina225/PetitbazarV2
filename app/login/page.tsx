import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import AuthOptions from '@/lib/auth';
import LoginForm from '@/components/auth/LoginForm';

export default async function LoginPage() {
  const session = await getServerSession(AuthOptions);

  if (session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-2">Connexion</h1>
        <p className="text-slate-600 mb-8">Accédez à votre compte PetitBazar</p>
        <LoginForm />
      </div>
    </div>
  );
}
