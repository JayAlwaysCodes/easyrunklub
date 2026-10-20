"use client";

import { useActionState } from "react";
import Image from "next/image";

import { loginAction, type ActionState } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuthModal } from "@/components/shared/auth-modal-context";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );
  const { openRegisterDisclaimer } = useAuthModal();

  return (
    <Card>
      <CardHeader className="justify-items-center text-center">
        <Image
          src="/logo.jpeg"
          alt="Easy Run Klub"
          width={56}
          height={56}
          className="rounded-full object-cover"
        />
        <CardTitle className="font-heading text-xl">
          Login to Account
        </CardTitle>
        <CardDescription>
          Welcome back, login to your account
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
            <a
              href="/forgot-password"
              className="inline-block text-xs text-muted-foreground hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-brand-green text-white hover:bg-brand-green/90"
          >
            {isPending ? "Logging in..." : "Login"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            First time here?{" "}
            <button
              type="button"
              onClick={openRegisterDisclaimer}
              className="font-medium text-brand-forest underline underline-offset-4"
            >
              Sign up
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}