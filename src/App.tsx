import { AppShell } from "./AppShell";
import { LOCAL_UID } from "./lib/store";

// no sign-in yet, the auth gate goes here once accounts exist
function App() {
  return <AppShell uid={LOCAL_UID} />;
}

export default App;
