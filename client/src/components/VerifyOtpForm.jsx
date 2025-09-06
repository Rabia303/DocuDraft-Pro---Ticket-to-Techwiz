import { useState } from "react";
import { verifyOtp } from "../api";

export default function VerifyOtpForm({ email, onVerified }) {
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await verifyOtp(email, otp);
    if (res.message) {
      setMsg("Email verified successfully");
      onVerified();
    } else {
      setMsg(res.error || "Verification failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Verify OTP</h2>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        required
      /><br />
      <button type="submit">Verify</button>
      <p>{msg}</p>
    </form>
  );
}
