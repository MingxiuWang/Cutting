'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/app/_actions/auth';
import { loginAction } from '@/app/_actions/session';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: FormData) => {
    setError(null);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const result = await signup({ email, password });
    if (!result.ok) {
      const fieldMsg = Object.values(result.fieldErrors ?? {}).flat().join('; ');
      setError(fieldMsg || result.message || `Signup failed (${result.error})`);
      return;
    }
    const fd = new FormData();
    fd.set('email', email);
    fd.set('password', password);
    const loginResult = await loginAction(fd);
    if (!loginResult.ok) {
      setError(`Account created, but auto-login failed (${loginResult.error}). Please log in manually.`);
      router.push('/login');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <form action={onSubmit} className="grid gap-4">
      <h1 className="text-2xl font-semibold text-neutral-900">Sign up</h1>
      <div className="grid gap-1.5">
        <label htmlFor="signup-email" className="text-sm font-medium text-neutral-700">Email</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="signup-password" className="text-sm font-medium text-neutral-700">Password</label>
        <input
          id="signup-password"
          name="password"
          type="password"
          required
          placeholder="8+ chars, letter + digit"
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors"
      >
        Create account
      </button>
      <a href="/login" className="text-sm text-neutral-500 hover:text-neutral-900 text-center">
        Already have an account? Log in
      </a>
    </form>
  );
}
