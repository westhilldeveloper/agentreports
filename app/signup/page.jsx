'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AgentSignup() {
  const [step, setStep] = useState('details');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('OTP sent! Verify to complete signup.');
        setStep('otp');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  const verifyAndSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Sign in with OTP (this will create the agent if doesn't exist)
      const res = await signIn('agent-otp', {
        email: form.email,
        otp,
        redirect: false,
      });
      if (res?.error) {
        setError('Invalid or expired OTP');
      } else {
        // Update agent details (name, phone) - the agent was created with generic values during OTP verification
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        if (session?.user?.id) {
          // Update agent details
          await fetch(`/api/admin/agents/update`, { // We need to create this endpoint or handle differently
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: session.user.id, name: form.name, phone: form.phone }),
          });
          router.push(`/agent/${session.user.id}`);
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
        <h1 className="text-2xl font-bold mb-2 text-center">Agent Sign Up</h1>

        {step === 'details' && (
          <form onSubmit={sendOTP}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="w-full px-3 py-2 border rounded mb-3"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              className="w-full px-3 py-2 border rounded mb-3"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              className="w-full px-3 py-2 border rounded mb-3"
              value={form.email}
              onChange={handleChange}
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
          <form onSubmit={verifyAndSignup}>
            <p className="text-sm text-gray-600 mb-2">OTP sent to {form.email}</p>
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
              {loading ? 'Verifying...' : 'Create Account'}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-4 text-gray-600">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}