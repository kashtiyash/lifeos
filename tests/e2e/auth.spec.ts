import { expect, test } from "@playwright/test";

import {
  ALICE,
  BOB,
  TEST_AUTH_ENABLED,
  setTestUser,
  signInViaApi,
  signOutViaApi,
} from "./helpers/auth";

test.describe("secret-free test-auth adapter", () => {
  test.skip(
    !TEST_AUTH_ENABLED,
    "Requires E2E_TEST_AUTH=1; playwright.config.ts enables it for the managed dev server.",
  );

  test("a signed-in test user reaches the protected app", async ({
    page,
    context,
  }) => {
    await setTestUser(context, ALICE.id);

    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "Today" }),
    ).toBeVisible();
    await expect(page.getByTestId("e2e-user-name").first()).toHaveText(
      ALICE.name,
    );
  });

  test("a forged cookie value is treated as signed out", async ({
    page,
    context,
  }) => {
    await setTestUser(context, "user_e2e_forged");

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/sign-in/);
  });

  test("switching the session cookie switches the active account", async ({
    page,
    context,
  }) => {
    await setTestUser(context, ALICE.id);
    await page.goto("/dashboard");
    await expect(page.getByTestId("e2e-user-name").first()).toHaveText(
      ALICE.name,
    );

    await setTestUser(context, BOB.id);
    await page.goto("/dashboard");
    await expect(page.getByTestId("e2e-user-name").first()).toHaveText(
      BOB.name,
    );
  });

  test("the sign-in page mints a session and sign-out clears it", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("button", { name: `Continue as ${ALICE.name}` })
      .click();

    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByTestId("e2e-user-name").first()).toHaveText(
      ALICE.name,
    );

    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/sign-in/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("the sign-in API rejects unknown test users", async ({ page }) => {
    const response = await page.request.post("/api/e2e/auth", {
      data: { userId: "user_e2e_forged" },
    });

    expect(response.status()).toBe(400);
  });

  test("the API route sets and clears the session cookie", async ({ page }) => {
    await signInViaApi(page, BOB.id);
    await page.goto("/dashboard");
    await expect(page.getByTestId("e2e-user-name").first()).toHaveText(
      BOB.name,
    );

    await signOutViaApi(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });
});
