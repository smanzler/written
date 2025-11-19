import { LoginForm } from "@/components/auth/login-form";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 md:p-10">
      <div className="w-full max-w-md xl:max-w-4xl">
        <LoginForm />
      </div>
    </div>
  );
}
