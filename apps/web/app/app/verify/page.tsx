export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm cf-muted">
          Ti abbiamo inviato un link di accesso. Aprilo per entrare.
        </p>
        <p className="mt-4 text-xs cf-faint">
          Se non arriva, controlla spam/promozioni.
        </p>
      </div>
    </div>
  );
}
