import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { getRegistrationOptions, register } from '../../api/auth.api';
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
  const { state } = useLocation();
  const { data: options } = useQuery({ queryKey: ['registration-options'], queryFn: getRegistrationOptions });
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', role: 'CUSTOMER' } });
  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success('Account created');
      navigate('/login', { state });
    },
    onError: error => toast.error(getApiErrorMessage(error, 'Registration failed'))
  });

  const { errors } = form.formState;

  return (
    <main className="auth-layout">
      <div className="auth-art" aria-hidden="true"><p>The night is yours.</p></div>
      <form onSubmit={form.handleSubmit(values => mutation.mutate(values))} className="auth-form">
        <p className="eyebrow">EventFlow account</p>
        <h1>Create an account</h1>
        <label>Name
          <input autoComplete="name" aria-invalid={Boolean(errors.name)} {...form.register('name')} />
          {errors.name && <span className="field-error" role="alert">Enter at least two characters.</span>}
        </label>
        <label>Email
          <input type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...form.register('email')} />
          {errors.email && <span className="field-error" role="alert">Enter a valid email address.</span>}
        </label>
        <label>Password
          <input type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...form.register('password')} />
          {errors.password && <span className="field-error" role="alert">Enter at least eight characters.</span>}
        </label>
        {options?.staffRoles && <label>Role
          <select {...form.register('role')}>
            {(['CUSTOMER', 'ORGANIZER', 'VENUE_MANAGER', 'ADMIN'] as UserRole[]).map(role => (
              <option key={role} value={role}>{role.replace('_', ' ')}</option>
            ))}
          </select>
        </label>}
        <button className="button-dark focus-ring" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating account…' : 'Register'}
          <UserPlus size={18} aria-hidden="true" />
        </button>
        <p>Have an account? <Link to="/login" state={state}>Log in</Link></p>
      </form>
    </main>
  );
}
