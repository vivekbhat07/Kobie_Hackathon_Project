import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import api, { apiError } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Brand from '../components/Brand.jsx';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!email) return <Navigate to="/login" replace />;

  const handleVerify = async () => {
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code });
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Verification failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    try {
      await api.post('/auth/send-otp', { email });
      setInfo('A new code is on its way.');
    } catch (err) {
      setError(apiError(err, 'Could not resend the code.'));
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
        <div className="mb-8 flex flex-col items-center gap-3">
          <Brand size="lg" />
          <p className="text-xs text-mut/70 font-mono tracking-widest uppercase">
            Growing enterprise value through loyalty
          </p>
        </div>

        <div className="card p-7 shadow-2xl shadow-black/40">
          <div className="h-0.5 bg-gradient-to-r from-beacon to-transparent rounded-full mb-6 -mx-7 px-7" />

          <h1 className="font-display text-xl font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
            Enter your code
          </h1>
          <p className="mt-1 text-sm text-mut">
            Sent to <span className="font-mono text-fg">{email}</span>
          </p>

          <div className="mt-6">
            <label htmlFor="otp" className="field-label">
              6-digit code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              placeholder="000000"
              className="field-input text-center font-mono text-2xl tracking-[0.5em]"
            />
          </div>

          {error && <p className="mt-3 text-sm text-crit">{error}</p>}
          {info && <p className="mt-3 text-sm text-ok">{info}</p>}

          <button onClick={handleVerify} disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? 'Verifying…' : 'Verify & sign in →'}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button onClick={() => navigate('/login')} className="text-mut hover:text-fg transition">
              ← Change email
            </button>
            <button onClick={handleResend} className="text-beacon hover:underline transition">
              Resend code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
