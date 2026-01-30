"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Building2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: () => {
          router.push("/dashboard");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold text-foreground">HRFlow</span>
          </div>
          <p className="text-muted-foreground text-sm">HR Management System</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-card-foreground">Sign in</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isPending}
                  className="bg-input border-border"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isPending}
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button type="button" className="text-sm text-primary hover:underline cursor-pointer">
                  Forgot password?
                </button>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-3">Demo credentials</p>
              <div className="grid gap-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-secondary/50">
                  <span className="text-muted-foreground">Admin:</span>
                  <code className="text-card-foreground">admin@example.com / Admin123!</code>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-secondary/50">
                  <span className="text-muted-foreground">HR Manager:</span>
                  <code className="text-card-foreground">hr@hrflow.com / hr123</code>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-secondary/50">
                  <span className="text-muted-foreground">Employee:</span>
                  <code className="text-card-foreground">sarah.johnson@hrflow.com / emp123</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          This is an internal system. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}
