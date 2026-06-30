'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; // ✅ import Image

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-8 transition-all duration-200">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image 
            src="/fn_logo.png" 
            alt="Coinplus Logo" 
            width={80} 
            height={80} 
            className="rounded-full" 
            priority 
          />
        </div>

        <h1 className="text-2xl font-light text-gray-800 text-center mb-1">Welcome Back</h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          {step === 'email' 
            ? 'Enter your registered email to receive a one‑time password' 
            : 'Enter the 6‑digit code sent to your email'}
        </p>

        {step === 'email' && (
          <form onSubmit={sendOTP} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm -mt-2">{error}</p>}
            {message && <p className="text-green-500 text-sm -mt-2">{message}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition duration-200 shadow-sm hover:shadow-md"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOTP} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Code sent to <span className="font-medium">{email}</span>
            </p>
            <div>
              <label htmlFor="otp" className="block text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
                One‑Time Password
              </label>
              <input
                id="otp"
                type="text"
                placeholder="e.g. 123456"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm text-center tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm -mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl transition duration-200 shadow-sm hover:shadow-md"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setMessage(''); }}
              className="w-full text-blue-600 text-sm hover:underline mt-1"
            >
              ← Go back
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}