export function RequestFeedback({ success, error }: { success?: string; error?: string }) {
  if (!success && !error) return null
  return <div className={`mb-6 border p-4 text-sm leading-6 ${error ? "border-destructive/40 text-destructive" : "border-primary/40 bg-primary/5"}`} role={error ? "alert" : "status"}>{error || success}</div>
}
