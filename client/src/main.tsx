import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./auth-autofill-fix";

createRoot(document.getElementById("root")!).render(<App />);
