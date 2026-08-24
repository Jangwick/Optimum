import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      let message: string | undefined;
      if (err instanceof AxiosError) {
        message = (
          (err.response?.data as Record<string, unknown> | undefined)?.['error'] as string | undefined
        );
      }
      setError(message ?? 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-lg shadow-lg border border-surface-border p-8">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Optimum Logo" className="w-20 h-20 object-contain mb-4" />
          <h1 className="text-headline-lg font-semibold text-primary">Optimum Claims</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Insurance Adjustment System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="admin@optimum.com"
              required
            />
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-error-container text-on-error-container text-body-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-primary text-on-primary font-semibold rounded hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
