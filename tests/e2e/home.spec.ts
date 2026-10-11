import { expect, test } from "@playwright/test";

test("public landing renders the product heading", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /your day, organized/i }),
  ).toBeVisible();
});

test("protected area redirects signed-out visitors to sign-in", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/sign-in/);
});

const viewports = [
  { name: "320", width: 320, height: 800 },
  { name: "360", width: 360, height: 800 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`no page-level horizontal overflow at ${viewport.name}px`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
