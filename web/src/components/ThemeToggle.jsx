import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    // 如果当前是 system，先获取实际的主题
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  // 判断当前是否为暗色模式
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <Button 
      variant="outline" 
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden border-2 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300"
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      {/* 太阳图标 */}
      <Sun className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-500 ${
        isDark 
          ? 'rotate-90 scale-0 opacity-0' 
          : 'rotate-0 scale-100 opacity-100'
      }`} />
      
      {/* 月亮图标 */}
      <Moon className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-500 ${
        isDark 
          ? 'rotate-0 scale-100 opacity-100' 
          : '-rotate-90 scale-0 opacity-0'
      }`} />
      
      <span className="sr-only">切换主题</span>
    </Button>
  )
}
