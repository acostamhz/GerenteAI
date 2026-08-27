import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ScheduleThemeManager() {
  const { theme } = useTheme()

  React.useEffect(() => {
    if (theme !== "schedule") return

    const updateScheduleTheme = () => {
      const hour = new Date().getHours()
      // Noche: 19:00 (7 PM) a 05:59 (6 AM) -> Modo Oscuro
      // Día: 06:00 (6 AM) a 18:59 (7 PM) -> Modo Claro
      const isNight = hour >= 19 || hour < 6
      const root = document.documentElement

      if (isNight) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }

    updateScheduleTheme()
    const interval = setInterval(updateScheduleTheme, 60000)

    return () => clearInterval(interval)
  }, [theme])

  return null
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider themes={["light", "dark", "system", "schedule"]} {...props}>
      <ScheduleThemeManager />
      {children}
    </NextThemesProvider>
  )
}
