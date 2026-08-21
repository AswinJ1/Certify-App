"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { Check, Info, AlertTriangle, AlertCircle, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  let theme: ToasterProps["theme"] = "system"
  try {
    const themeContext = useTheme()
    if (themeContext?.theme) {
      theme = themeContext.theme as ToasterProps["theme"]
    }
  } catch {
    theme = "system"
  }

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-right"
      richColors={false}
      expand={false}
      visibleToasts={4}
      gap={8}
      offset="20px"
      closeButton
      icons={{
        success: <Check className="w-4 h-4 text-black dark:text-white flex-shrink-0" strokeWidth={2} />,
        info: <Info className="w-4 h-4 text-black dark:text-white flex-shrink-0" strokeWidth={2} />,
        warning: <AlertTriangle className="w-4 h-4 text-black dark:text-white flex-shrink-0" strokeWidth={2} />,
        error: <AlertCircle className="w-4 h-4 text-black dark:text-white flex-shrink-0" strokeWidth={2} />,
        loading: <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white flex-shrink-0" strokeWidth={2} />,
      }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "vercel-toast",
          title: "vercel-toast-title",
          description: "vercel-toast-description",
          actionButton: "vercel-toast-action",
          cancelButton: "vercel-toast-cancel",
          closeButton: "vercel-toast-close",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }


