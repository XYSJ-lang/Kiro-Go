import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { 
  Plus, Trash2, Key, Clock, Activity, Loader2, Copy, 
  RefreshCw, Edit, TestTube, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertCircle, Zap, TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

export default function ApiKeysPanel({ apiKeys, loading, onCreate, onDelete, onRefresh, onToggle, onEdit, onTest }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedKeys, setExpandedKeys] = useState(new Set())

  const formatDate = (timestamp) => {
    if (!timestamp) return '从未'
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id)
      .then(() => toast.success('已复制密钥 ID'))
      .catch(() => toast.error('复制失败'))
  }

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedKeys)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedKeys(newExpanded)
  }

  const filteredKeys = apiKeys.filter(key => 
    key.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.lastUsed).length,
    enabled: apiKeys.filter(k => k.enabled !== false).length
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-0 shadow-md glass">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Key className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">总密钥数</p>
                <p className="text-xl font-bold">{stats.total}</p>
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
                <p className="text-xs text-muted-foreground">已启用</p>
                <p className="text-xl font-bold">{stats.enabled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md glass">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">已使用</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card className="border-0 shadow-md glass">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="搜索密钥名称或 ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-2 focus:border-purple-500 dark:focus:border-purple-400"
            />
            <Button
              onClick={onCreate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all btn-scale"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建密钥
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 密钥列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>加载中...</p>
        </div>
      ) : filteredKeys.length === 0 ? (
        <Card className="border-0 shadow-md glass">
          <CardContent className="py-16 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? '未找到匹配的密钥' : '暂无 API 密钥'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? '尝试使用其他关键词搜索' : '创建密钥以访问 API 服务'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreate} variant="outline" className="border-2 border-border">
                <Plus className="w-4 h-4 mr-2" />
                创建第一个密钥
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredKeys.map((key, index) => {
            const isExpanded = expandedKeys.has(key.id)
            const isEnabled = key.enabled !== false
            
            return (
              <Card
                key={key.id}
                className="card-hover border-0 shadow-md glass overflow-hidden group relative animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* 顶部状态条 */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  !isEnabled
                    ? 'bg-muted'
                    : key.lastUsed
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500'
                    : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500'
                }`} />

                <CardContent className="pt-4 pb-3">
                  {/* 主要信息行 */}
                  <div className="flex items-center gap-3">
                    {/* 左侧：图标和基本信息 */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
                        !isEnabled
                          ? 'bg-muted'
                          : 'bg-gradient-to-br from-purple-600 to-pink-600'
                      }`}>
                        <Key className="w-5 h-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">{key.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                            onClick={() => handleCopyId(key.id)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isEnabled ? (
                            <Badge variant="secondary" className="text-xs h-5 px-2">
                              <XCircle className="w-3 h-3 mr-1" />
                              已禁用
                            </Badge>
                          ) : key.lastUsed ? (
                            <Badge className="text-xs h-5 px-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 border">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              运行中
                            </Badge>
                          ) : (
                            <Badge className="text-xs h-5 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 border">
                              <Zap className="w-3 h-3 mr-1" />
                              就绪
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ID: {key.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        onClick={() => toggleExpand(key.id)}
                        title="展开详情"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        onClick={() => onEdit && onEdit(key)}
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-green-100 dark:hover:bg-green-900/30"
                        onClick={() => onTest && onTest(key.id)}
                        title="测试连接"
                      >
                        <TestTube className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                        onClick={() => onRefresh && onRefresh(key.id)}
                        title="刷新"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDelete(key.id)}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* 展开的详细信息 */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* 时间信息 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs text-muted-foreground">创建时间</span>
                          </div>
                          <p className="text-sm font-semibold">{formatDate(key.createdAt)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs text-muted-foreground">最后使用</span>
                          </div>
                          <p className="text-sm font-semibold">{formatDate(key.lastUsed)}</p>
                        </div>
                      </div>

                      {/* 配置信息 */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">启用状态</span>
                          <Switch 
                            checked={isEnabled} 
                            onCheckedChange={() => onToggle && onToggle(key.id, isEnabled)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">优先级</span>
                          <Badge variant="outline" className="text-xs">
                            {key.priority || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">权重</span>
                          <Badge variant="outline" className="text-xs">
                            {key.weight || 1}
                          </Badge>
                        </div>
                      </div>

                      {/* 统计信息 */}
                      {key.stats && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg p-2 border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-700 dark:text-green-300 mb-1">成功</p>
                            <p className="text-lg font-bold text-green-900 dark:text-green-100">
                              {key.stats.success || 0}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 rounded-lg p-2 border border-red-200 dark:border-red-800">
                            <p className="text-xs text-red-700 dark:text-red-300 mb-1">失败</p>
                            <p className="text-lg font-bold text-red-900 dark:text-red-100">
                              {key.stats.failed || 0}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">响应</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              {key.stats.avgResponseTime || '-'}ms
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
