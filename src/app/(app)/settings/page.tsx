'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { changeEmail, changePassword } from '@/app/_actions/auth';
import { deleteAccount, logout } from '@/app/_actions/session';

const inputClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const labelClass = 'text-sm font-medium text-neutral-700';
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors';
const secondaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors';
const destructiveBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors';

type Status = { kind: 'ok' | 'err'; text: string } | null;

function StatusBlock({ status }: { status: Status }) {
  if (!status) return null;
  const cls =
    status.kind === 'ok'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-red-50 border-red-200 text-red-700';
  return <div className={`${cls} border text-sm p-3 rounded-md`}>{status.text}</div>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [emailMsg, setEmailMsg] = useState<Status>(null);
  const [pwMsg, setPwMsg] = useState<Status>(null);
  const [delMsg, setDelMsg] = useState<Status>(null);

  const onChangeEmail = (formData: FormData) =>
    startTransition(async () => {
      const result = await changeEmail({ email: String(formData.get('email')) });
      setEmailMsg(
        result.ok
          ? { kind: 'ok', text: 'Email updated' }
          : { kind: 'err', text: result.message ?? 'Failed' },
      );
    });

  const onChangePassword = (formData: FormData) =>
    startTransition(async () => {
      const result = await changePassword({
        currentPassword: String(formData.get('currentPassword')),
        newPassword: String(formData.get('newPassword')),
      });
      setPwMsg(
        result.ok
          ? { kind: 'ok', text: 'Password updated' }
          : { kind: 'err', text: result.message ?? 'Failed' },
      );
    });

  const onDelete = (formData: FormData) =>
    startTransition(async () => {
      if (!confirm('Permanently delete your account and all data?')) return;
      const result = await deleteAccount({ password: String(formData.get('password')) });
      if (result.ok) router.push('/');
      else setDelMsg({ kind: 'err', text: result.message ?? 'Failed' });
    });

  return (
    <div className="space-y-8 max-w-md">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Settings</h1>
      </header>

      <section className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-base font-medium text-neutral-900">Account email</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Update the email address you sign in with.</p>
        </div>
        <form action={onChangeEmail} className="grid gap-3">
          <div className="grid gap-1.5">
            <label className={labelClass} htmlFor="email">New email</label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <button disabled={pending} className={primaryBtn}>Save</button>
          <StatusBlock status={emailMsg} />
        </form>
      </section>

      <section className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-base font-medium text-neutral-900">Password</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Choose a strong new password.</p>
        </div>
        <form action={onChangePassword} className="grid gap-3">
          <div className="grid gap-1.5">
            <label className={labelClass} htmlFor="currentPassword">Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" required className={inputClass} />
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass} htmlFor="newPassword">New password</label>
            <input id="newPassword" name="newPassword" type="password" required className={inputClass} />
          </div>
          <button disabled={pending} className={primaryBtn}>Save</button>
          <StatusBlock status={pwMsg} />
        </form>
      </section>

      <section>
        <form action={logout}>
          <button className={secondaryBtn}>Sign out</button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/30 p-5 space-y-4">
        <div>
          <h2 className="text-base font-medium text-red-700">Danger zone</h2>
          <p className="text-sm text-neutral-600 mt-0.5">Permanently delete your account and all of your data. This cannot be undone.</p>
        </div>
        <form action={onDelete} className="grid gap-3">
          <div className="grid gap-1.5">
            <label className={labelClass} htmlFor="del-password">Confirm with your password</label>
            <input id="del-password" name="password" type="password" required className={inputClass} />
          </div>
          <button disabled={pending} className={destructiveBtn}>Delete account</button>
          <StatusBlock status={delMsg} />
        </form>
      </section>
    </div>
  );
}
