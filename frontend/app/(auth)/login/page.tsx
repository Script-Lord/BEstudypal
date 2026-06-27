'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  return (
    <div className="min-h-dvh flex">
      {/* Left — brand panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between w-[45%] bg-bg-surface border-r border-bg-border p-12"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-accent" />
          <span className="text-base font-semibold text-ink">StudyBuddy</span>
        </div>

        <div>
          <h1 className="text-4xl font-semibold text-ink leading-tight text-balance mb-4">
            Your documents,<br />finally answering back.
          </h1>
          <p className="text-ink-muted leading-relaxed max-w-xs">
            Upload any PDF, DOCX, or presentation. Ask questions in plain language. Get answers grounded in your own files.
          </p>
        </div>

        <div className="flex gap-8 text-sm text-ink-faint">
          <span>End-to-end secure</span>
          <span>Any file format</span>
          <span>Instant answers</span>
        </div>
      </motion.div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <BookOpen className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-ink">StudyBuddy</span>
            </div>
            <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
            <p className="text-sm text-ink-muted mt-1">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-accent hover:text-accent-hover transition-colors">
                Create one
              </Link>
            </p>
          </div>

          <Button
            variant="ghost"
            size="lg"
            className="w-full border border-bg-border mb-6"
            loading={oauthLoading}
            onClick={handleGoogle}
          >
            <Chrome className="w-4 h-4" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-bg-border" />
            <span className="text-xs text-ink-faint">or</span>
            <div className="flex-1 h-px bg-bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-bg-elevated border border-bg-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 transition-all"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-status-failed"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
