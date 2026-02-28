export const dynamic = "force-dynamic";
export const revalidate = 0;

import ResetPasswordForm from "../_components/ResetForm";

export default function Page({
  searchParams,
}: {
  searchParams: { token?: string; email?: string };
}) {
  return (
    <div className="mx-auto w-full max-w-[520px] p-4 sm:p-6">
      <ResetPasswordForm
        token={searchParams.token ?? ""}
        email={searchParams.email ?? ""}
      />
    </div>
  );
}
