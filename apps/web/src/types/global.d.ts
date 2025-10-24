// Global type declarations for browser APIs
declare global {
  interface Navigator {
    clipboard: {
      writeText(text: string): Promise<void>;
    };
  }
}

export {};
