import type { Metadata } from "next";
import "./globals.css";
import "./extended.css";

export const metadata: Metadata = {
  title: "FitEval · AI 穿搭模型评测平台",
  description: "面向 AI 穿搭团队的模型输出质量评测与 Bad Case 分析工作台。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "FitEval · AI 穿搭模型评测平台",
    description: "从输出评分到 Bad Case 归因",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FitEval AI 穿搭模型评测平台" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitEval · AI 穿搭模型评测平台",
    description: "从输出评分到 Bad Case 归因",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
