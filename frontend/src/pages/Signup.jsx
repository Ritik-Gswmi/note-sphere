import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Signup() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const name = String(form?.name || "").trim();
    const email = String(form?.email || "").trim();
    const password = String(form?.password || "");

    if (!name || !email || !password) return "All fields are required";
    if (name.length < 3 || name.length > 40) return "Username must be 3–40 characters";
    if (!/^[a-zA-Z0-9_ ]+$/.test(name))
      return "Username can contain letters, numbers, spaces and _";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
    if (password.length < 6) return "Password must be at least 6 characters long";
    return "";
  };

  const handleSubmit = async () => {
    const clientError = validate();
    if (clientError) return alert(clientError);
    try {
      await api.post("/auth/signup", form);

      alert("Signup successful! Please login.");
      navigate("/login"); //  redirect to login
    } catch (err) {
      const msg = err?.response?.data?.msg || "Signup failed";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            Create account
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Sign up to start using your dashboard.
          </p>
        </div>

        <input
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          placeholder="Username"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          className="mt-3 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          className="mt-3 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          onClick={handleSubmit}
          className="mt-4 w-full rounded-md bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create account
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-slate-900 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
