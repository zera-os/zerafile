// Global type declarations for browser APIs
declare global {
  interface Window {
    FileReader: typeof FileReader;
    open: (url: string, target?: string) => void;
  }
  
  interface Navigator {
    clipboard: {
      writeText(text: string): Promise<void>;
    };
  }
  
  interface DataTransfer {
    files: FileList;
  }
  
  interface HTMLInputElement {
    files: FileList | null;
    value: string;
  }
  
  interface HTMLTextAreaElement {
    value: string;
  }
}

export {};
