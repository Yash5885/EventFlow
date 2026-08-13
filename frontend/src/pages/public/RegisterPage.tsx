import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { register } from '../../api/auth.api';
import type { UserRole } from '../../types';
import { getApiErrorMessage } from '../../utils/apiErrors';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CUSTOMER', 'ORGANIZER', 'VENUE_MANAGER', 'ADMIN']).optional()
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', role: 'CUSTOMER' } });
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success('Account created');
      navigate('/login');
    },
    onError: error => toast.error(getApiErrorMessage(error, 'Registration failed'))
  });

  return (
    <main className="page-container grid min-h-[calc(100vh-130px)] place-items-center py-8">
      <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="w-full max-w-md rounded-md border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Register</h1>
        <label className="mt-5 block text-sm font-medium">
          Name
          <input className="focus-ring mt-2 h-11 w-full rounded-sm border border-input px-3" {...form.register('name')} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Email
          <input className="focus-ring mt-2 h-11 w-full rounded-sm border border-input px-3" type="email" {...form.register('email')} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input className="focus-ring mt-2 h-11 w-full rounded-sm border border-input px-3" type="password" {...form.register('password')} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Role
          <select className="focus-ring mt-2 h-11 w-full rounded-sm border border-input px-3" {...form.register('role')}>
            {(['CUSTOMER', 'ORGANIZER', 'VENUE_MANAGER', 'ADMIN'] as UserRole[]).map(role => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <button className="focus-ring mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit" disabled={mutation.isPending}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Register
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          Have an account? <Link className="font-semibold text-primary" to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
