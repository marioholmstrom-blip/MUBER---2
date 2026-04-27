import React, { useState } from "react";
import HomeScreen from "./HomeScreen";
import UserScreen from "./UserScreen";
import AssistedScreen from "./AssistedScreen";
import DriverScreen from "./DriverScreen";

export default function App() {
  const [screen, setScreen] = useState("home");

  if (screen === "user") {
    return <UserScreen goHome={() => setScreen("home")} />;
  }

  if (screen === "assisted") {
    return <AssistedScreen goHome={() => setScreen("home")} />;
  }

  if (screen === "driver") {
    return <DriverScreen goHome={() => setScreen("home")} />;
  }

  return (
    <HomeScreen
      goUser={() => setScreen("user")}
      goAssisted={() => setScreen("assisted")}
      goDriver={() => setScreen("driver")}
    />
  );
}