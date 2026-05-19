import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Plus, Trash2, Key, Clock, Activity, Loader2 } from 'lucide-react'

export default function ApiKeysPanel({ apiKeys, loading, onCreate, onDelete }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return '从未'
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter(k => k.lastUsed).length,
    unused: apiKeys.filter(k => !k.lastUsed).length
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总密钥</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Key className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已使用</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">未使用</p>
                <p className="text-2xl font-bold text-gray-400">{stats.unused}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">API 密钥管理</h2>
          <p className="text-sm text-muted-foreground mt-1">管理用于访问 API 的密钥</p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          创建密钥
        </Button>
      </div>

      {/* 密钥列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>加载中...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground mb-2">暂无 API 密钥</p>
            <p className="text-sm text-muted-foreground mb-4">创建密钥以访问 API 服务</p>
            <Button onClick={onCreate} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              创建第一个密钥
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {apiKeys.map((key) => (
            <Card key={key.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-semibold text-lg truncate">{key.name}</h3>
                      {key.lastUsed ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          已使用
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400 border-gray-400">
                          未使用
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>创建时间: {formatDate(key.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        <span>最后使用: {formatDate(key.lastUsed)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(key.id)}
                  >
                    <Trash2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">删除</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
