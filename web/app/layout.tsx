import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { AuthProvider } from "@/components/auth-provider"
import { ConfirmProvider } from "@/components/confirm-provider"
import { ImageLightboxProvider } from "@/components/image-lightbox"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AppI18nProvider } from "@/i18n/provider"

import "@/app/globals.css"
import "md-editor-rt/lib/style.css"
import "@/styles/main.scss"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const paletteScript = `
try {
  var palette = window.localStorage.getItem("dashboard_palette");
  document.documentElement.dataset.palette = palette === "blue" || palette === "gray" ? palette : "green";
} catch (_) {
  document.documentElement.dataset.palette = "green";
}
`

// Set locale on <html> BEFORE React hydration so the browser won't auto-translate
// the page and cause a hydration mismatch. Uses the same resolution order as
// config.ts: localStorage → navigator.languages → default.
const localeScript = `
try {
  var locale = window.localStorage.getItem("cs_ai_agent_locale");
  if (locale !== "zh-CN" && locale !== "en-US") {
    locale = null;
  }
  if (!locale) {
    var langs = window.navigator.languages || [window.navigator.language];
    for (var i = 0; i < langs.length; i++) {
      var l = (langs[i] || "").toLowerCase();
      if (l === "zh-cn" || l === "zh" || l === "zh-hans") { locale = "zh-CN"; break; }
      if (l === "en-us" || l === "en") { locale = "en-US"; break; }
    }
  }
  document.documentElement.lang = locale || "en-US";
} catch (_) {
  document.documentElement.lang = "en-US";
}
`

export const metadata: Metadata = {
  title: "AI Customer Service Admin",
  description: "AI Customer Service Admin",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: paletteScript + localeScript }} />
        <AppI18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <ConfirmProvider>
                <ImageLightboxProvider>
                  <TooltipProvider>
                    {children}
                    <Toaster position="top-center" richColors />
                  </TooltipProvider>
                </ImageLightboxProvider>
              </ConfirmProvider>
            </AuthProvider>
          </ThemeProvider>
        </AppI18nProvider>
      </body>
    </html>
  )
}
