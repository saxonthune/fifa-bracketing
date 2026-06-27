import { Router, Route } from "@solidjs/router";
import { Home } from "./pages/Home";
import { Builder } from "./pages/Builder";
import { Tracker } from "./pages/Tracker";
import { BracketViewer } from "./pages/BracketViewer";
import { PinnedBrackets } from "./pages/PinnedBrackets";

function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/builder" component={Builder} />
      <Route path="/tracker" component={Tracker} />
      <Route path="/viewer" component={BracketViewer} />
      <Route path="/pinned" component={PinnedBrackets} />
    </Router>
  );
}

export default App;
