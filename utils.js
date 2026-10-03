import { Vibration } from "react-native";

export function vibrate() {
  Vibration.vibrate([0, 400, 200, 400]);
}
