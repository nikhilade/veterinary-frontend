import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, PawPrint } from "lucide-react";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/api-client";
import { endpoints } from "@/lib/api/endpoints";

type VerifySearchParams = {
  email?: string;
};

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>): VerifySearchParams => {
    return {
      email: search.email as string | undefined,
    };
  },
  head: () => ({
    meta: [{ title: "Verify Account | Pet Good Veterinary" }],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 Form Data
  const [email, setEmail] = useState(search.email || "");
  const [otpCode, setOtpCode] = useState("");

  // Step 2 Form Data
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function onVerifyEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiClient.post(endpoints.auth.verifyEmail, {
        email,
        otp: otpCode,
      });
      toast.success("Email verified successfully!");
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function onResendOtp() {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiClient.post(endpoints.auth.resendVerificationOtp, { email });
      toast.success("A new verification code has been sent to your email!");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to resend code.");
    } finally {
      setBusy(false);
    }
  }

  async function onSetupPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }

    try {
      await apiClient.post(endpoints.auth.setupPassword, {
        email,
        password,
        confirmPassword,
      });
      toast.success("Password set successfully! You can now sign in.");
      navigate({ to: "/login", replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to setup password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage px-5 py-12">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-8 shadow-sm">
        <Link to="/" className="flex items-center text-2xl font-bold text-forest">
          Pet G<PawPrint className="inline size-5 -rotate-12 text-clay" />
          od
        </Link>

        {step === 1 && (
          <>
            <h1 className="mt-6 text-3xl font-medium">Verify your email</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Enter the verification code sent to your email.
            </p>

            <form onSubmit={onVerifyEmail} className="mt-8 space-y-4">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
              />
              <input
                required
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="6-digit verification code"
                maxLength={6}
                className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] tracking-widest outline-none focus:border-forest"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-forest px-8 py-3.5 font-medium text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Verifying…" : "Verify Account"}
              </button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={onResendOtp}
                  disabled={busy}
                  className="text-sm font-medium text-forest hover:underline disabled:opacity-60"
                >
                  Didn't receive the code? Resend it
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-forest/10 text-forest">
              <CheckCircle2 className="size-6" />
            </div>
            <h1 className="mt-4 text-3xl font-medium">Set your password</h1>
            <p className="mt-2 text-sm text-foreground/70">
              Your email has been verified. Now set a secure password to access your account.
            </p>

            <form onSubmit={onSetupPassword} className="mt-8 space-y-4">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New Password"
                minLength={8}
                className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
              />
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                minLength={8}
                className="w-full rounded-full border border-border bg-background px-5 py-3 text-[15px] outline-none focus:border-forest"
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-forest px-8 py-3.5 font-medium text-primary-foreground disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Password"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link to="/login" className="font-medium text-clay hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
