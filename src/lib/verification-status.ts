const VERIFICATION_DEADLINE_DAYS = 60;

export function isEmailVerificationOverdue({
  createdAt,
  emailVerified,
}: {
  createdAt: Date;
  emailVerified: Date | null;
}) {
  if (emailVerified) return false;

  const deadlineMs =
    createdAt.getTime() + VERIFICATION_DEADLINE_DAYS * 24 * 60 * 60 * 1000;

  return Date.now() > deadlineMs;
}

export function daysUntilVerificationDeadline(createdAt: Date) {
  const deadlineMs =
    createdAt.getTime() + VERIFICATION_DEADLINE_DAYS * 24 * 60 * 60 * 1000;

  const remainingMs = deadlineMs - Date.now();
  return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
}