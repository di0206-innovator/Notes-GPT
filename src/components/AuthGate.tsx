'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { ShieldAlert, Terminal, HelpCircle, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

interface AuthGateProps {
  onAuthenticated: (uid: string) => void;
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Brute-force protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimeLeft]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (lockoutTimeLeft > 0) {
      setError(`Login disabled. Please wait ${lockoutTimeLeft}s.`);
      return;
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('Password reset link has been sent to your email.');
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setSuccessMessage('Account created! A verification link has been sent to your email. Please verify your email before logging in.');
        setIsSignUp(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          await signOut(auth);
          setError('Your email address is not verified. Please check your inbox for the verification link.');
          return;
        }
        
        setFailedAttempts(0);
        onAuthenticated(user.uid);
      }
    } catch (error) {
      const err = error as Error & { code?: string };
      console.error('Auth error:', err);
      
      let message = err.message || 'Authentication failed.';
      
      if (!isSignUp && !isForgotPassword) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 5) {
          setLockoutTimeLeft(30);
          setFailedAttempts(0);
          setError('Too many failed login attempts. System locked for 30 seconds.');
          setLoading(false);
          return;
        }
        
        if (err.code === 'auth/invalid-credential') {
          message = `Invalid email or password credentials. (Attempt ${nextAttempts}/5)`;
        }
      }

      if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many requests. Access temporarily blocked by server security.';
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      setError('Please enter your email and password to request a verification email resend.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setResendLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setSuccessMessage('A fresh verification link has been sent to your email.');
    } catch (err) {
      const errorObj = err as Error & { code?: string };
      let message = errorObj.message || 'Failed to resend verification email.';
      if (errorObj.code === 'auth/invalid-credential') {
        message = 'Invalid credentials. Enter correct email & password to resend verification.';
      }
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setGuestLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      onAuthenticated(userCredential.user.uid);
    } catch (err) {
      const errorObj = err as Error;
      console.warn('Firebase guest auth failed, falling back to local offline session:', errorObj);
      onAuthenticated('local-guest-user');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle CRT Line Overlay */}
      <div className="crt-overlay" />

      {/* Terminal Main Container */}
      <div className="max-w-md w-full border-2 border-white bg-black p-6 retro-shadow relative z-10">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-6">
          <div className="flex items-center gap-2 text-white">
            <Terminal className="w-4.5 h-4.5 animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider">SYSTEM_LOGIN_SHELL</span>
          </div>
          <span className="text-[10px] text-white/60">V1.1.0</span>
        </div>

        {/* ASCII Banner */}
        <pre className="text-[9px] text-white font-mono leading-none text-center select-none overflow-x-auto whitespace-pre pb-4 border-b border-dashed border-white/20 mb-6">
{` _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _
/                                                \\
|         N O T E S   G P T   V 1 . 1 . 0        |
\\_  _  _  _  _  _  _  _  _  _  _  _  _  _  _  _  /`}
        </pre>

        <p className="text-xs text-white/80 leading-relaxed mb-6">
          {isForgotPassword 
            ? 'Request a secure password reset link. Verify your identity using the link sent to your university email address.' 
            : 'Initialize secure user session. This guarantees isolated storage for note uploads and generated study materials in the Firestore cloud vector store.'}
        </p>

        {/* Authentication Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white">
              [E-MAIL ADDRESS]
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.edu"
              disabled={lockoutTimeLeft > 0}
              className="retro-input w-full text-xs font-mono"
            />
          </div>

          {!isForgotPassword && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white">
                [SECURE PASSWORD]
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={lockoutTimeLeft > 0}
                className="retro-input w-full text-xs font-mono"
              />
            </div>
          )}

          {error && (
            <div className="border border-white p-3 bg-black flex items-start gap-2.5 text-xs text-white">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>SECURITY_ERROR:</strong> {error}
              </span>
            </div>
          )}

          {successMessage && (
            <div className="border border-white p-3 bg-black flex items-start gap-2.5 text-xs text-green-400">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>STATUS:</strong> {successMessage}
              </span>
            </div>
          )}

          {/* Form CTAs */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || guestLoading || lockoutTimeLeft > 0}
              className={`retro-button text-xs py-2.5 flex items-center justify-center gap-2 ${lockoutTimeLeft > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : lockoutTimeLeft > 0 ? (
                `LOCKED (${lockoutTimeLeft}s)`
              ) : isForgotPassword ? (
                'RESET PASSWORD'
              ) : isSignUp ? (
                'SIGNUP'
              ) : (
                'LOGIN'
              )}
            </button>
            
            {!isForgotPassword ? (
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading || guestLoading}
                className="retro-button bg-white text-black border-2 border-white hover:bg-black hover:text-white text-xs py-2.5 flex items-center justify-center gap-2"
              >
                {guestLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'GUEST BYPASS'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="retro-button bg-white text-black border-2 border-white hover:bg-black hover:text-white text-xs py-2.5 flex items-center justify-center gap-2"
              >
                BACK TO LOGIN
              </button>
            )}
          </div>
        </form>

        {/* Resend verification triggers if they get locked/unverified */}
        {!isForgotPassword && error && error.includes('not verified') && (
          <div className="mt-4 p-3 border border-white/40 bg-white/5 flex flex-col gap-2">
            <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Need to resend verification?</p>
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="retro-button text-[10px] py-1 text-center font-bold"
            >
              {resendLoading ? 'SENDING...' : 'RESEND VERIFICATION EMAIL'}
            </button>
          </div>
        )}

        {/* Toggle Mode / Forgot Password */}
        <div className="mt-6 text-center border-t border-dashed border-white/20 pt-4 flex flex-col gap-2">
          {!isForgotPassword ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-[10px] uppercase text-white/80 hover:text-white underline font-bold tracking-wider"
              >
                {isSignUp
                  ? 'Already registered? Access your account'
                  : 'Create a new notes credentials account'}
              </button>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-[10px] uppercase text-white/50 hover:text-white underline font-bold tracking-wider"
                >
                  Forgot your password?
                </button>
              )}
            </>
          ) : null}
        </div>

        {/* Console Tips */}
        <div className="mt-6 flex gap-2 p-3 border border-white/20 bg-white/5 text-[9px] font-mono leading-normal text-white/60">
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <div>
            <span className="text-white font-bold uppercase block mb-0.5">Console Notes:</span>
            {isForgotPassword 
              ? 'Password reset email will only be sent if the account exists. Check spam folders if the email does not arrive.'
              : 'Guests can run on local device mode or quick cloud tests. Logged accounts preserve study kits across browser refreshes and device changes.'}
          </div>
        </div>

      </div>
    </div>
  );
}
