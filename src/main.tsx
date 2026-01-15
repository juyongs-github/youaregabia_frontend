import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import LoginForm from "./Components/auth/LoginForm.tsx";
import RegisterForm from "./Components/auth/RegisterForm.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* <App /> */}
    {/* <LoginForm />  */}
    <RegisterForm />
  </StrictMode>
);
