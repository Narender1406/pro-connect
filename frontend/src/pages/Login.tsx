import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    // TEMP (replace with API later)
    login(
      { _id: "1", name: "Yash", email: "yash@test.com" },
      "fake-jwt-token"
    );
    navigate("/feed");
  };

  return (
    <div>
      <h2>Login</h2>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
