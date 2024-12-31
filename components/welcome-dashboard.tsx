"use client";

import { useStore } from "@/providers/store-provider";

const WelcomeDashboard = () => {
  const { username } = useStore();

  function getLocalTimeGreeting() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 0 && hour < 12) {
      return "☀️ Good Morning";
    } else if (hour >= 12 && hour < 18) {
      return "🌤️ Good Afternoon";
    } else if (hour >= 18 && hour < 22) {
      return "🌙 Good Evening";
    }
  }

  return (
    <div className="pl-10 mt-4">
      <h1 className="text-4xl md:text-5xl font-medium">
        {getLocalTimeGreeting() + ", " + username}
      </h1>
    </div>
  );
};

export default WelcomeDashboard;
