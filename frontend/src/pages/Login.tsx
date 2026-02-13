import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    // TEMP (replace with API later)
    const res = await axios.post("http://localhost:5000/api/auth/login",
      {"email,password": ""});
    login(
       res.data.user , res.data.token_ ,
      
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
