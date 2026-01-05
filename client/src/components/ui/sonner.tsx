import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a",
          "--normal-border": "rgba(26, 39, 68, 0.2)",
          "--border-radius": "0.75rem",
          "--success-bg": "#ffffff",
          "--success-text": "#0f172a",
          "--success-border": "rgba(26, 39, 68, 0.2)",
          "--error-bg": "#ffffff",
          "--error-text": "#0f172a",
          "--error-border": "rgba(239, 68, 68, 0.3)",
          "--warning-bg": "#ffffff",
          "--warning-text": "#0f172a",
          "--warning-border": "rgba(245, 166, 35, 0.3)",
          "--info-bg": "#ffffff",
          "--info-text": "#0f172a",
          "--info-border": "rgba(26, 39, 68, 0.2)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
