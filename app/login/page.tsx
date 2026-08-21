'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Award,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: isRegister ? name : undefined,
          organizationName: isRegister ? organizationName : undefined,
          action: isRegister ? 'register' : 'login',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Authentication failed';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success(isRegister ? 'Account created successfully! Redirecting...' : 'Signed in successfully! Redirecting...');

      if (data.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/organizer');
      }
    } catch {
      const errorMsg = 'Network error. Please verify your connection.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7fa] flex">
      {/* ── Left Hero / Feature Showcase Column (60% on lg) ── */}
      <div className="hidden lg:flex lg:w-7/12 bg-gradient-to-br from-[#7367f0] via-[#685dd8] to-[#5b4fbe] p-12 flex-col justify-between relative overflow-hidden text-white select-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-black/15 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white text-[#7367f0] flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight leading-tight">Certify Platform</div>
            <div className="text-xs text-white/80 font-medium tracking-wide">
              Enterprise Dynamic Certificate Engine
            </div>
          </div>
        </div>

        {/* Centerpiece Feature Showcase */}
        <div className="relative z-10 my-auto max-w-xl space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 border border-white/20 text-xs font-semibold uppercase tracking-wider text-white">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Credentialing
            </span>
            <h2 className="text-3xl font-bold tracking-tight leading-snug">
              Design, Issue & Verify Dynamic Certificates at Scale.
            </h2>
            <p className="text-sm text-white/85 leading-relaxed">
              No code required. Visual drag-and-resize template designer, automated CSV/XLSX recipient mapping, instant on-the-fly PDF generation, and public verification portals.
            </p>
          </div>

          {/* Floating Showcase Widgets */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-white/20 text-white">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/90">
                  Visual Canvas
                </div>
              </div>
              <div className="text-base font-bold">Drag & Resize Studio</div>
              <div className="text-xs text-white/75 mt-0.5">
                8-handle precision typography placement
              </div>
            </div>

            <div className="p-4 bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-white/20 text-white">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/90">
                  Dynamic Engine
                </div>
              </div>
              <div className="text-base font-bold">Zero Storage PDFs</div>
              <div className="text-xs text-white/75 mt-0.5">
                On-the-fly client downloads via pdf-lib
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Pill */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/80 font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#28c76f]" />
              <span>100% Configuration-driven</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00bad1]" />
              <span>Secure Access Portal</span>
            </span>
          </div>
          <span className="text-[11px] text-white/60">&copy; 2026 Certify Platform</span>
        </div>
      </div>

      {/* ── Right Authentication Column (40% on lg, 100% on mobile) ── */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-10 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 animate-in">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#7367f0] text-white flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-black">Certify Platform</div>
              <div className="text-xs text-[#6f6b7d]">Dynamic Certificate Portal</div>
            </div>
          </div>

          {/* Card Wrapper */}
          <div className="bg-white border border-[#dbdade] p-8 space-y-6 shadow-sm text-black">
            {/* Header */}
            <div>
              <h1 className="text-xl font-bold text-black">
                {isRegister ? 'Register Institution / Organizer' : 'Welcome to Certify!'}
              </h1>
              <p className="text-xs text-black mt-1 leading-relaxed">
                {isRegister
                  ? 'Set up your organization to start designing certificate templates and managing events.'
                  : 'Please enter your credentials to access your workspace.'}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-[#ea5455]/10 border border-[#ea5455]/30 text-[#ea5455] text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="font-semibold">{error}</div>
              </div>
            )}

            {/* Auth Form - Clean standard inputs with NO overlapping icons */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="text-xs text-black block mb-1 font-medium">Full Name *</label>
                    <input
                      className="w-full px-3 py-2.5 bg-white border border-[#dbdade] focus:border-[#7367f0] outline-none text-xs text-black placeholder:text-[#888888]"
                      type="text"
                      placeholder="e.g. Prof. Rajesh Kumar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={isRegister}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-black block mb-1 font-medium">Organization / Institution Name *</label>
                    <input
                      className="w-full px-3 py-2.5 bg-white border border-[#dbdade] focus:border-[#7367f0] outline-none text-xs text-black placeholder:text-[#888888]"
                      type="text"
                      placeholder="e.g. Amrita Vishwa Vidyapeetham"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      required={isRegister}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs text-black block mb-1 font-medium">Email Address *</label>
                <input
                  className="w-full px-3 py-2.5 bg-white border border-[#dbdade] focus:border-[#7367f0] outline-none text-xs text-black placeholder:text-[#888888]"
                  type="email"
                  placeholder="user@organization.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-black block mb-1 font-medium">Password *</label>
                <input
                  className="w-full px-3 py-2.5 bg-white border border-[#dbdade] focus:border-[#7367f0] outline-none text-xs text-black placeholder:text-[#888888]"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#7367f0] hover:bg-[#685dd8] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer border-0 mt-2"
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#ffffff' }} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Register Organization' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle Signin / Register */}
            <div className="text-center pt-2 border-t border-[#ebebed]">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-xs text-[#7367f0] hover:underline font-medium bg-transparent border-0 cursor-pointer"
              >
                {isRegister
                  ? 'Already have an account? Sign in here'
                  : 'New organizer? Register your institution here'}
              </button>
            </div>
          </div>

          <div className="text-center text-[11px] text-[#6f6b7d]">
            Protected by dynamic certificate security protocols.
          </div>
        </div>
      </div>
    </div>
  );
}
