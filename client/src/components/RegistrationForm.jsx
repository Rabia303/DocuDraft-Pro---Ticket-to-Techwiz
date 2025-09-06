import { useState } from "react";
import { registerUser } from "../api";

export default function RegisterForm({ onRegistered }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await registerUser(email, password);
    if (res.message) {
      setMsg("OTP sent to your email");
      onRegistered(email); // pass email forward
    } else {
      setMsg(res.error || "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      /><br />
      <button type="submit">Register</button>
      <p>{msg}</p>
    </form>
  );
}
