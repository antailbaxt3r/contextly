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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.register({ email, password, display_name: displayName });
      return api.login({ email, password });
    },
    onSuccess: (tokens) => {
      setTokens(tokens);
      router.replace("/dashboard");
    },
    onError: (e: unknown) => {
      setError(
        e instanceof ApiError ? e.message : "Could not create the account.",
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
      title="Make an account"
      subtitle="Takes about ten seconds. No card, no email confirmation."
      footer={
        <>
          Already have one?{" "}
          <Link href="/login" className="text-sage-deep hover:underline">
            Sign in instead
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Name"
          name="display_name"
          autoComplete="name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="What should we call you?"
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          error={error}
        />
        <Button type="submit" className="w-full mt-2" loading={mutation.isPending}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
