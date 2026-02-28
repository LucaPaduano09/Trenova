import ForgotPasswordCard from "../_components/ForgotPasswordCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] p-4 sm:p-6">
      <ForgotPasswordCard />
    </div>
  );
}
