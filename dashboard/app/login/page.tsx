import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-card">
        <h1>GearCore Bot</h1>
        <p>Sign in to control the public Discord bot.</p>
        <LoginForm />
      </div>
    </main>
  );
}
