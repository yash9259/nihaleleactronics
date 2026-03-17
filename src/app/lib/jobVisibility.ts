type JobVisibilityInput = {
  title?: string | null;
  customer_name?: string | null;
  mobile_number?: string | null;
  problem_reported?: string | null;
};

export function isPlaceholderJobTitle(title?: string | null) {
  const normalized = (title || "").trim().toLowerCase();
  return !normalized || normalized === "new job" || normalized === "service job";
}

export function isAssignedJob(job: JobVisibilityInput) {
  return Boolean(
    (job.customer_name || "").trim() ||
      (job.mobile_number || "").trim() ||
      (job.problem_reported || "").trim()
  );
}

export function shouldShowJob(job: JobVisibilityInput) {
  return isAssignedJob(job) || !isPlaceholderJobTitle(job.title);
}
