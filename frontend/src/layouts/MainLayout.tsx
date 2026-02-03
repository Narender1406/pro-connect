import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout ()  {
  return (
    <>
      <Navbar />
      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </>
  );
}
