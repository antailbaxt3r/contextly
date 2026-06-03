"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.login({ email, password }),
    onSuccess: (tokens) => {
      setTokens(tokens);
      router.replace("/dashboard");
    },
    onError: (e: unknown) => {
      setError(
        e instanceof ApiError
          ? e.message
          : "Something went wrong. Try again.",
      );
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep talking with your documents."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="text-sage-deep hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          error={error}
        />
        <Button type="submit" className="w-full mt-2" loading={mutation.isPending}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
