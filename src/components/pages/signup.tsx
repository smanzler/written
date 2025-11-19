import { SignupForm } from "@/components/auth/signup-form";

export default function Signup() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 md:p-10">
      <div className="w-full max-w-md xl:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  );
}
