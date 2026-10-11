import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

import { E2ESignIn } from "@/components/e2e-sign-in";
import { isE2ETestAuthEnabled } from "@/lib/auth/e2e/config";
import { E2E_TEST_USERS } from "@/lib/auth/e2e/users";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  if (isE2ETestAuthEnabled()) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-12">
        <E2ESignIn
          options={E2E_TEST_USERS}
          title="Sign in"
          description="Choose a test account to continue."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <SignIn fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
