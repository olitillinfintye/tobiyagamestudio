// Must come first: this captures the password-recovery hash before the supabase
// client can initialise and strip it from the URL. See src/lib/recoveryLink.ts.
import "./lib/recoveryLink";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
