import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { getApiErrorMessage } from '../../utils/apiErrors';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(state => state.setAuth);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: auth => {
      setAuth(auth);
      toast.success('Logged in');
      navigate(auth.user.role === 'ADMIN' ? '/admin' : auth.user.role === 'ORGANIZER' ? '/organizer' : auth.user.role === 'VENUE_MANAGER' ? '/venue' : '/dashboard');
    },
    onError: error => toast.error(getApiErrorMessage(error, 'Login failed'))
  });

  return (
    <main className="page-container grid min-h-[calc(100vh-130px)] place-items-center py-8">
      <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="w-full max-w-md rounded-md border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Login</h1>
        <label className="mt-5 block text-sm font-medium">
          Email
          <input className="focus-ring mt-2 h-11 w-full rounded-sm border border-input px-3" type="email" {...form.register('email')} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input className="focus-ring mt-2 h-11 w-full rounded-sm border border-input px-3" type="password" {...form.register('password')} />
        </label>
        <button className="focus-ring mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit" disabled={mutation.isPending}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Login
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          New here? <Link className="font-semibold text-primary" to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
