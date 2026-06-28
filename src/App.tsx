import { Router, Route } from "@solidjs/router";
import { Home } from "./pages/Home";
import { Builder } from "./pages/Builder";
import { Tracker } from "./pages/Tracker";
import { BracketViewer } from "./pages/BracketViewer";
import { Leaderboard } from "./pages/Leaderboard";
import { Header } from "./components/Header";

function App() {
  return (
    <Router root={Header}>
      <Route path="/" component={Home} />
      <Route path="/builder" component={Builder} />
      <Route path="/tracker" component={Tracker} />
      <Route path="/viewer" component={BracketViewer} />
      <Route path="/leaderboard" component={Leaderboard} />
    </Router>
  );
}

export default App;
