import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const MainLayout = () =>  {
  return (
    <>
      <Navbar />
      <main style={{ background: "#f3f2ef" , minHeight:"100vh"}}>
        <Outlet />
      </main>
    </>
  );
}
export default MainLayout;