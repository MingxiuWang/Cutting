'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changeEmail, changePassword } from '@/app/_actions/auth';
import { deleteAccount, logout } from '@/app/_actions/session';

export default function SettingsPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [delMsg, setDelMsg] = useState<string | null>(null);

  const onChangeEmail = (formData: FormData) =>
    startTransition(async () => {
      const result = await changeEmail({ email: String(formData.get('email')) });
      setEmailMsg(result.ok ? 'Email updated' : result.message ?? 'Failed');
    });

  const onChangePassword = (formData: FormData) =>
    startTransition(async () => {
      const result = await changePassword({
        currentPassword: String(formData.get('currentPassword')),
        newPassword: String(formData.get('newPassword')),
      });
      setPwMsg(result.ok ? 'Password updated' : result.message ?? 'Failed');
    });

  const onDelete = (formData: FormData) =>
    startTransition(async () => {
      if (!confirm('Permanently delete your account and all data?')) return;
      const result = await deleteAccount({ password: String(formData.get('password')) });
      if (result.ok) router.push('/');
      else setDelMsg(result.message ?? 'Failed');
    });

  return (
    <div className="space-y-10 max-w-md">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section>
        <h2 className="text-lg font-medium mb-2">Change email</h2>
        <form action={onChangeEmail} className="grid gap-2">
          <input name="email" type="email" required className="border rounded p-2" />
          <button disabled={pending} className="bg-black text-white rounded p-2 disabled:opacity-50">Save</button>
          {emailMsg && <p className="text-sm">{emailMsg}</p>}
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Change password</h2>
        <form action={onChangePassword} className="grid gap-2">
          <input name="currentPassword" type="password" required placeholder="Current password" className="border rounded p-2" />
          <input name="newPassword" type="password" required placeholder="New password" className="border rounded p-2" />
          <button disabled={pending} className="bg-black text-white rounded p-2 disabled:opacity-50">Save</button>
          {pwMsg && <p className="text-sm">{pwMsg}</p>}
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Sign out</h2>
        <form action={logout}>
          <button className="border rounded p-2">Sign out</button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium text-red-700 mb-2">Delete account</h2>
        <form action={onDelete} className="grid gap-2">
          <input name="password" type="password" required placeholder="Password" className="border rounded p-2" />
          <button disabled={pending} className="bg-red-600 text-white rounded p-2 disabled:opacity-50">Delete account</button>
          {delMsg && <p className="text-sm text-red-700">{delMsg}</p>}
        </form>
      </section>
    </div>
  );
}
