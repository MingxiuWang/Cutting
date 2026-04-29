'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup, loginAction } from '@/app/_actions/auth';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: FormData) => {
    setError(null);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const result = await signup({ email, password });
    if (!result.ok) {
      setError(result.message ?? 'Signup failed');
      return;
    }
    const fd = new FormData();
    fd.set('email', email);
    fd.set('password', password);
    await loginAction(fd);
    router.push('/dashboard');
  };

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <input name="email" type="email" required placeholder="Email" className="border rounded p-2" />
      <input name="password" type="password" required placeholder="Password (8+ chars, letter+digit)" className="border rounded p-2" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="bg-black text-white rounded p-2">Create account</button>
      <a href="/login" className="text-sm text-neutral-600">Already have an account? Log in</a>
    </form>
  );
}
