import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiError } from '../api/client.js';
import Brand from '../components/Brand.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Enter your email to continue.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: email.trim() });
      navigate('/verify', { state: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setError(apiError(err, 'Could not send the code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-full items-center justify-center px-5 py-12"
      style={{
        background: 'radial-gradient(ellipse at 20% 50%, #304F7E18 0%, transparent 60%), #051C2C',
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Brand size="lg" />
          <p className="text-xs text-mut/70 font-mono tracking-widest uppercase">
            Growing enterprise value through loyalty
          </p>
        </div>

        <div className="card p-7 shadow-2xl shadow-black/40">
          {/* Coral top accent */}
          <div className="h-0.5 bg-gradient-to-r from-beacon to-transparent rounded-full mb-6 -mx-7 px-7" />

          <h1 className="font-display text-xl font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
            Sign in to AlertPortal
          </h1>
          <p className="mt-1 text-sm text-mut">
            We'll email you a one-time code. Use a pes.edu or kobie.ai address.
          </p>

          <div className="mt-6">
            <label htmlFor="email" className="field-label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="you@kobie.ai"
              className="field-input"
            />
          </div>

          {error && <p className="mt-3 text-sm text-crit">{error}</p>}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? 'Sending code…' : 'Send code →'}
          </button>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-mut/40">
          GitOps alert management · PrometheusRule generator
        </p>
      </div>
    </div>
  );
}
