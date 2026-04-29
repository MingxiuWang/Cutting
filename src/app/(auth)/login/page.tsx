'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/_actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: FormData) => {
    setError(null);
    const result = await loginAction(formData);
    if (!result.ok) {
      setError('Invalid email or password');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <input name="email" type="email" required placeholder="Email" className="border rounded p-2" />
      <input name="password" type="password" required placeholder="Password" className="border rounded p-2" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="bg-black text-white rounded p-2">Log in</button>
      <a href="/signup" className="text-sm text-neutral-600">No account? Sign up</a>
    </form>
  );
}
