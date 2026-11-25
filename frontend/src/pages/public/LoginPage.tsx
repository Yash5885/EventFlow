import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

const customerDestination = /^\/(?:my-bookings|dashboard|profile|events\/[\w-]+\/seats|checkout\/[\w-]+|booking\/[\w-]+\/confirm)$/;

export function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const setAuth = useAuthStore(state => state.setAuth);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: auth => {
      setAuth(auth);
      toast.success('Logged in');
      const from = state?.from;
      if (auth.user.role === 'CUSTOMER' && typeof from?.pathname === 'string' && customerDestination.test(from.pathname)) {
        navigate({ pathname: from.pathname, search: from.search, hash: from.hash }, { replace: true });
        return;
      }
      navigate(auth.user.role === 'ADMIN' ? '/admin' : auth.user.role === 'ORGANIZER' ? '/organizer' : auth.user.role === 'VENUE_MANAGER' ? '/venue' : '/dashboard');
    },
    onError: error => toast.error(getApiErrorMessage(error, 'Login failed'))
  });

  const { errors } = form.formState;

  return (
    <main className="auth-layout">
      <div className="auth-art" aria-hidden="true"><p>Good to see you.</p></div>
      <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="auth-form">
        <p className="eyebrow">EventFlow account</p>
        <h1>Log in</h1>
        <label>Email
          <input type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...form.register('email')} />
          {errors.email && <span className="field-error" role="alert">Enter a valid email address.</span>}
        </label>
        <label>Password
          <input type="password" autoComplete="current-password" aria-invalid={Boolean(errors.password)} {...form.register('password')} />
          {errors.password && <span className="field-error" role="alert">Enter at least eight characters.</span>}
        </label>
        <button className="button-dark focus-ring" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Logging in…' : 'Log in'}
          <LogIn size={18} aria-hidden="true" />
        </button>
        <p>New here? <Link to="/register" state={state}>Create an account</Link></p>
      </form>
    </main>
  );
}
