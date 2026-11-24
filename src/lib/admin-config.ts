/** Admin accounts are issued MANUALLY by the system operator. Social login is never allowed for admins. */
export function bootstrapAdminCredentials() {
  const custom = Boolean(process.env.ADMIN_BOOTSTRAP_EMAIL && process.env.ADMIN_BOOTSTRAP_PASSWORD);
  return {
    email: process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@yousee.local",
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || "YouseeAdmin2026!",
    isDemo: !custom,
  };
}
