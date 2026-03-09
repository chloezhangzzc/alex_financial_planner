import "@/styles/globals.css";
import type { AppProps } from "next/app";

import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastContainer } from "@/components/Toast";
import { DemoProvider } from "@/lib/demo-data";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <DemoProvider>
        <Component {...pageProps} />
        <ToastContainer />
      </DemoProvider>
    </ErrorBoundary>
  );
}
