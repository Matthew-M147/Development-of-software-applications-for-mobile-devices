import { registerRootComponent } from "expo";
import App from "./App";

// registerRootComponent обгортає App у AppRegistry.registerComponent і
// гарантує правильне налаштування для Expo Go та дев-білдів.
registerRootComponent(App);
