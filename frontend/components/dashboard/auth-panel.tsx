"use client";

import { useState } from "react";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/services/api";

type AuthPanelProps = {
  user: UserProfile | null;
  isLoading: boolean;
  onSignIn: (payload: { email: string; password: string }) => Promise<void>;
  onSignUp: (payload: { full_name: string; email: string; password: string }) => Promise<void>;
  onSignOut: () => void;
};

export function AuthPanel({ user, isLoading, onSignIn, onSignUp, onSignOut }: AuthPanelProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await onSignUp({ full_name: fullName, email, password });
      } else {
        await onSignIn({ email, password });
      }
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your uploads and history are saved under this account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-background p-3">
            <div className="font-medium">{user.full_name}</div>
            <div className="mt-1 text-sm text-muted-foreground">{user.email}</div>
            <div className="mt-2 text-xs uppercase tracking-wide text-primary">{user.role}</div>
          </div>
          <Button variant="outline" className="w-full" onClick={onSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "signup" ? "Create Account" : "Sign In"}</CardTitle>
        <CardDescription>Sign in before uploading to keep a private prescription history.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant={mode === "signin" ? "default" : "outline"} onClick={() => setMode("signin")}>
            <LogIn className="h-4 w-4" />
            Sign in
          </Button>
          <Button variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>
            <UserPlus className="h-4 w-4" />
            Sign up
          </Button>
        </div>
        {mode === "signup" ? <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" /> : null}
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        {error ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div> : null}
        <Button className="w-full" disabled={isSubmitting || isLoading} onClick={submit}>
          {mode === "signup" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {isSubmitting ? "Please wait" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </CardContent>
    </Card>
  );
}
