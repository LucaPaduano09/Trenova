import AuthCard from "../../../app/_components/AuthCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SignInClientPage() {
  return <AuthCard variant="client" defaultCallbackUrl="/c" />;
}
