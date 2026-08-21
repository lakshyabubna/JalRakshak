import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "JalRakshak 2.0", description: "Rural public health early warning system" };
export default function Layout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
