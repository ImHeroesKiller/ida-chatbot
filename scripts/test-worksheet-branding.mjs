#!/usr/bin/env node

const DEFAULTS = {
  brandName: "IDA",
  footerText: "Worksheet",
  logoDataUrl: null,
};

function mergeWorksheetBrandingPrefs(adminDefaults, userPrefs, hasUserOverride) {
  if (!hasUserOverride) return adminDefaults;

  return {
    brandName: userPrefs?.brandName?.trim() || adminDefaults.brandName,
    footerText: userPrefs?.footerText?.trim() || adminDefaults.footerText,
    logoDataUrl:
      userPrefs?.logoDataUrl !== undefined
        ? userPrefs.logoDataUrl
        : adminDefaults.logoDataUrl,
  };
}

function testUsesAdminDefaultsWithoutOverride() {
  const checks = [];
  const admin = { brandName: "Acme Corp", footerText: "Report", logoDataUrl: null };
  const result = mergeWorksheetBrandingPrefs(admin, { brandName: "Local" }, false);

  if (result.brandName !== "Acme Corp") {
    checks.push("expected admin brand without override");
  }

  return { pass: checks.length === 0, checks };
}

function testUserOverrideWins() {
  const checks = [];
  const admin = { brandName: "Acme Corp", footerText: "Report", logoDataUrl: null };
  const result = mergeWorksheetBrandingPrefs(
    admin,
    { brandName: "My Brand", footerText: "Doc", logoDataUrl: "data:image/png;base64,abc" },
    true,
  );

  if (result.brandName !== "My Brand" || result.footerText !== "Doc") {
    checks.push("expected user override values");
  }

  return { pass: checks.length === 0, checks };
}

async function main() {
  const tests = [
    ["admin-defaults", testUsesAdminDefaultsWithoutOverride()],
    ["user-override", testUserOverrideWins()],
  ];

  console.log("Worksheet branding tests\n");

  let failed = false;
  for (const [name, result] of tests) {
    console.log(`${name}: ${result.pass ? "PASS" : "FAIL"}`);
    if (result.checks.length) {
      console.log(`  ${result.checks.join("; ")}`);
    }
    if (!result.pass) failed = true;
  }

  if (failed) process.exit(1);
}

main();