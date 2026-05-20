import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import {
  FileText, RefreshCw, Search, Filter, Clock,
  CheckCircle2, XCircle, AlertCircle, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function LogsPanel({ password }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/admin/api/audit-logs', {
        headers: { 'X-Admin-Password': password }
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data || [])
      } else {
        toast.error('加载日志失败')
      }
    } catch (e) {
      toast.error('加载日志失败')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getLevelBadge = (level) => {
    const variants = {
      info: { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700', icon: CheckCircle2 },
      warn: { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700', icon: AlertCircle },
      error: { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700', icon: XCircle }
    }
    const variant = variants[level] || variants.info
    const Icon = variant.icon
    return (
      <Badge className={`text-xs border ${variant.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {level.toUpperCase()}
      </Badge>
    )
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel
    return matchesSearch && matchesLevel
  })

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-md glass">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">总日志数</p>
                <p className="text-xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md glass">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">信息</p>
                <p className="text-xl font-bold">{logs.filter(l => l.level === 'info').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md glass">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">警告</p>
                <p className="text-xl font-bold">{logs.filter(l => l.level === 'warn').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md glass">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">错误</p>
                <p className="text-xl font-bold">{logs.filter(l => l.level === 'error').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card className="border-0 shadow-md glass">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索操作、消息或用户..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterLevel === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('all')}
                className="border-2"
              >
                全部
              </Button>
              <Button
                variant={filterLevel === 'info' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('info')}
                className="border-2"
              >
                信息
              </Button>
              <Button
                variant={filterLevel === 'warn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('warn')}
                className="border-2"
              >
                警告
              </Button>
              <Button
                variant={filterLevel === 'error' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterLevel('error')}
                className="border-2"
              >
                错误
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                disabled={loading}
                className="border-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card className="border-0 shadow-md glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            审计日志
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">暂无日志记录</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getLevelBadge(log.level)}
                        <span className="font-semibold text-sm">{log.action}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                    <p className="text-sm text-foreground mb-2">{log.message}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {log.user && <span>用户: {log.user}</span>}
                      {log.target && <span>目标: {log.target}</span>}
                      {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
