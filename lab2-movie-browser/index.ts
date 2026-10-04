import { registerRootComponent } from "expo";
import App from "./App";

// registerRootComponent обгортає App у AppRegistry.registerComponent,
// і додатково гарантує, що middleware (наприклад, react-native-reload на web)
// налаштоване правильно для Expo Go та дев-білдів.
registerRootComponent(App);
