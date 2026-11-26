import AppRoutes from "./routes/AppRoutes";
import SessionProvider from "./auth/SessionProvider";
import "./App.css";
import "./accounts.css";
export default function App() {
  return (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  );
}
