import type { ReactNode } from "react";
import { Providers } from "../providers";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
