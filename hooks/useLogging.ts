import { siteConfig } from "@/config/site";
import useAppSettingsStore from "@/stores/appSettings/useAppSettingsStore";
import { useEffect } from "react";

const useLogging = () => {
  const isLoggingEnabled = useAppSettingsStore((state) => state.isLoggingEnabled);

  useEffect(() => {
    // Check if window is defined (i.e., if we're running in the browser)
    if (typeof window !== "undefined") {
      // Initialize the namespaced global logging variables
      window[siteConfig.name] = {
        isLoggingEnabled: false, // Default value
      };

      // Synchronize the Zustand store state with the global variable
      window[siteConfig.name].isLoggingEnabled = isLoggingEnabled;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      window.consoleLog = (...args: any[]) => {
        if (window[siteConfig.name].isLoggingEnabled) {
          const stack = new Error().stack;
          // Attempt to extract caller info from the stack trace
          const callerInfo = stack ? stack.split("\n")[2].trim() : null;
          console.log(callerInfo, ...args);
          // console.log(...args);
        }
      };
    }
  }, [isLoggingEnabled]);
};

export default useLogging;
