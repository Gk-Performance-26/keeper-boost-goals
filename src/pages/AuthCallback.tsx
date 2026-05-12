import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const REDIRECT_AFTER_LOGIN = "/";

const collectCallbackParams = () => {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });

  return params;
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Safety net: if nothing finishes within 15s, surface a manual exit.
    const stuckTimer = setTimeout(() => {
      if (!cancelled) setStuck(true);
    }, 15000);

    const finishOAuthLogin = async () => {
      const params = collectCallbackParams();
      const oauthError = params.get("error_description") || params.get("error");

      try {
        if (oauthError) throw new Error(oauthError);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const code = params.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          if (!data.session) throw new Error("Callback OAuth sem sessão válida.");
        }

        if (!cancelled) navigate(REDIRECT_AFTER_LOGIN, { replace: true });
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Não foi possível concluir o login.";
          setErrorMessage(message);
        }
      }
    };

    finishOAuthLogin();

    return () => {
      cancelled = true;
      clearTimeout(stuckTimer);
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        {errorMessage ? (
          <>
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="font-display text-2xl">Falha no login</h1>
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Button onClick={() => navigate("/auth", { replace: true })} className="mt-2">
              Voltar ao login
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <h1 className="font-display text-2xl">A concluir login…</h1>
            <p className="text-sm text-muted-foreground">Só mais um instante.</p>
            {stuck && (
              <Button
                variant="outline"
                onClick={() => navigate("/auth", { replace: true })}
                className="mt-4"
              >
                Cancelar e voltar
              </Button>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default AuthCallback;
