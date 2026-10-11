import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

import { E2ESignIn } from "@/components/e2e-sign-in";
import { isE2ETestAuthEnabled } from "@/lib/auth/e2e/config";
import { E2E_TEST_USERS } from "@/lib/auth/e2e/users";

export const metadata: Metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  if (isE2ETestAuthEnabled()) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-12">
        <E2ESignIn
          options={E2E_TEST_USERS}
          title="Create account"
          description="Test-auth mode signs in as an existing test account."
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <SignUp fallbackRedirectUrl="/dashboard" />
    </div>
  );
}
