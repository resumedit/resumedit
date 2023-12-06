export type AppGlobals = {
  isLoggingEnabled: boolean;
};

declare global {
  interface Window {
    [siteConfigName: string]: AppGlobals;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consoleLog: (...args: any[]) => void;
  }
}
