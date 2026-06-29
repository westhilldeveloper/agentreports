'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AgentSignin() {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('OTP sent to your email!');
        setStep('otp');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signIn('agent-otp', {
        email,
        otp,
        redirect: false,
      });
      if (res?.error) {
        setError('Invalid or expired OTP');
      } else {
        // Fetch session to get agent ID
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        if (session?.user?.id) {
          router.push(`/agent/${session.user.id}`);
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-2 text-center">Agent Sign In</h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          {step === 'email' ? 'Enter your registered email' : 'Enter the OTP sent to your email'}
        </p>

        {step === 'email' && (
          <form onSubmit={sendOTP}>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full px-3 py-2 border rounded mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            {message && <p className="text-green-500 text-sm mb-3">{message}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOTP}>
            <p className="text-sm text-gray-600 mb-2">OTP sent to {email}</p>
            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full px-3 py-2 border rounded mb-3"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              required
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setMessage(''); }}
              className="w-full text-blue-600 text-sm mt-2 hover:underline"
            >
              ← Go back
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-4 text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}