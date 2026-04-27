import { useState } from "react";
import { Navigate, useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import gkLogo from "@/assets/gk-logo.jpg";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";
import { TermsContent } from "@/components/TermsContent";
import { lovable } from "@/integrations/lovable";

const Auth = () => {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const schema = z.object({
    email: z.string().trim().email(t("auth.email")).max(255),
    password: z.string().min(6).max(72),
    displayName: z.string().trim().min(2).max(40).optional(),
  });

  if (!loading && user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      email,
      password,
      displayName: mode === "signup" ? displayName : undefined,
    });
    if (!parsed.success) {
      toast({ title: t("auth.checkDetails"), description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (mode === "signup" && !acceptedPrivacy) {
      toast({ title: t("auth.checkDetails"), description: t("auth.mustAcceptPrivacy"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast({ title: t("auth.welcome"), description: t("auth.welcomeDesc") });
        navigate("/onboarding");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.somethingWrong");
      toast({ title: t("auth.error"), description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const signInWithProvider = async (provider: "google" | "apple") => {
    if (mode === "signup" && !acceptedPrivacy) {
      toast({ title: t("auth.checkDetails"), description: t("auth.mustAcceptPrivacy"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        const msg = result.error instanceof Error ? result.error.message : t("auth.somethingWrong");
        toast({ title: t("auth.error"), description: msg, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      if (result.redirected) return;
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("auth.somethingWrong");
      toast({ title: t("auth.error"), description: msg, variant: "destructive" });
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="overflow-hidden rounded-2xl shadow-glow ring-1 ring-primary/30">
          <img
            src={gkLogo}
            alt="GK Performance Hub logo"
            className="h-32 w-32 object-cover"
          />
        </div>
        <h1 className="font-display text-2xl text-center tracking-wide">
          GK <span className="text-gradient-primary">PERFORMANCE</span> HUB
        </h1>
        <p className="text-center text-sm text-muted-foreground italic">{t("auth.tagline")}</p>
      </div>

      <Card className="w-full gradient-card border-border/60 shadow-card">
        <CardHeader className="pb-2">
          <div className="flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === "signup" ? "bg-card text-foreground shadow" : "text-muted-foreground"
              }`}
            >
              {t("auth.signup")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                mode === "signin" ? "bg-card text-foreground shadow" : "text-muted-foreground"
              }`}
            >
              {t("auth.signin")}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => signInWithProvider("google")}
              disabled={submitting || (mode === "signup" && !acceptedPrivacy)}
              className="w-full bg-card hover:bg-muted"
              size="lg"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.84h5.36c-.23 1.4-1.66 4.12-5.36 4.12-3.22 0-5.86-2.67-5.86-5.96s2.64-5.96 5.86-5.96c1.84 0 3.07.78 3.77 1.45l2.57-2.48C16.78 3.7 14.6 2.7 12 2.7 6.93 2.7 2.83 6.8 2.83 11.86s4.1 9.16 9.17 9.16c5.29 0 8.79-3.72 8.79-8.95 0-.6-.07-1.06-.16-1.52H12z"/>
              </svg>
              {t("auth.continueWithGoogle")}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => signInWithProvider("apple")}
              disabled={submitting || (mode === "signup" && !acceptedPrivacy)}
              className="w-full bg-card hover:bg-muted"
              size="lg"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              {t("auth.continueWithApple")}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="display">{t("auth.gkName")}</Label>
                <Input
                  id="display"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Iker, Manuel, Alisson..."
                  maxLength={40}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                maxLength={72}
              />
            </div>

            {mode === "signup" && (
              <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                <Checkbox
                  id="privacy"
                  checked={acceptedPrivacy}
                  onCheckedChange={(v) => setAcceptedPrivacy(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="privacy" className="text-xs leading-snug font-normal cursor-pointer">
                  {t("auth.acceptPrefix")}{" "}
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    {t("auth.terms")}
                  </button>{" "}
                  {t("auth.and")}{" "}
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    {t("auth.privacyPolicy")}
                  </button>
                </Label>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || (mode === "signup" && !acceptedPrivacy)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              size="lg"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "signup" ? (
                t("auth.startTraining")
              ) : (
                t("auth.login")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <Link to="/pricing" className="font-semibold text-primary underline-offset-2 hover:underline">
          {t("auth.seePricing")}
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms" className="hover:text-foreground hover:underline">
          {t("auth.terms")}
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/privacy" className="hover:text-foreground hover:underline">
          {t("auth.privacyPolicy")}
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/refund" className="hover:text-foreground hover:underline">
          {t("pricing.refundPolicy")}
        </Link>
      </nav>

      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("auth.privacyPolicy")}</DialogTitle>
          </DialogHeader>
          <PrivacyPolicyContent />
        </DialogContent>
      </Dialog>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("auth.terms")}</DialogTitle>
          </DialogHeader>
          <TermsContent />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
