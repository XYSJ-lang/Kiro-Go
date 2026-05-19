import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import {
  RefreshCw, Trash2, Power, Plus, Search,
  Eye, Loader2, AlertCircle, CheckCircle2,
  TrendingUp, Users, Activity
} from 'lucide-react'

export default function AccountsPanel({
  accounts,
  loading,
  searchTerm,
  onSearchChange,
  onRefresh,
  onAdd,
  onToggle,
  onRefreshAccount,
  onDelete,
  onShowDetail
}) {
  const [actionLoading, setActionLoading] = useState({})

  const handleAction = async (id, action) => {
    setActionLoading({ ...actionLoading, [id]: action })
    await action()
    setActionLoading({ ...actionLoading, [id]: null })
  }

  const filteredAccounts = accounts.filter(acc =>
    !searchTerm ||
    acc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: accounts.length,
    enabled: accounts.filter(a => a.enabled).length,
    disabled: accounts.filter(a => !a.enabled).length,
    pro: accounts.filter(a => a.subscriptionType?.includes('Pro')).length
  }

  const getSubBadge = (type) => {
    const badges = {
      'Free': { variant: 'secondary', label: 'Free' },
      'Pro': { variant: 'default', label: 'Pro' },
      'Pro_Plus': { variant: 'default', label: 'Pro+' },
      'Power': { variant: 'default', label: 'Power' }
    }
    return badges[type] || badges['Free']
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '从未'
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总账户</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已启用</p>
                <p className="text-2xl font-bold text-green-600">{stats.enabled}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">已禁用</p>
                <p className="text-2xl font-bold text-gray-400">{stats.disabled}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pro 账户</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pro}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索账户（邮箱、昵称、ID）..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={onRefresh} variant="outline" disabled={loading} className="flex-1 sm:flex-none">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={onAdd} className="flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" />
            添加账户
          </Button>
        </div>
      </div>

      {/* 账户列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>加载中...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? '未找到匹配的账户' : '暂无账户'}
            </p>
            {!searchTerm && (
              <Button onClick={onAdd} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                添加第一个账户
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-all duration-200 border-l-4"
                  style={{ borderLeftColor: account.enabled ? '#10b981' : '#d1d5db' }}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* 账户信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg truncate">
                        {account.nickname || account.email}
                      </h3>
                      <Badge {...getSubBadge(account.subscriptionType)}>
                        {getSubBadge(account.subscriptionType).label}
                      </Badge>
                      {account.enabled ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          已启用
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400 border-gray-400">
                          已禁用
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 truncate">{account.email}</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">认证:</span>
                        {account.authMethod === 'idc' ? 'IdC' : 'Social'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">请求:</span>
                        {account.requestCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">最后使用:</span>
                        {formatDate(account.lastUsed)}
                      </span>
                    </div>

                    {/* 用量进度条 */}
                    {account.usageCurrent !== undefined && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">用量</span>
                          <span className="font-medium">
                            {account.usageCurrent?.toFixed(2)} / {account.usageLimit?.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              (account.usageCurrent / account.usageLimit) > 0.9
                                ? 'bg-red-500'
                                : (account.usageCurrent / account.usageLimit) > 0.7
                                ? 'bg-yellow-500'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600'
                            }`}
                            style={{ width: `${Math.min((account.usageCurrent / account.usageLimit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 flex-wrap lg:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShowDetail(account.id)}
                    >
                      <Eye className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">详情</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(account.id, () => onRefreshAccount(account.id))}
                      disabled={actionLoading[account.id] === 'refresh'}
                    >
                      <RefreshCw className={`w-4 h-4 lg:mr-2 ${actionLoading[account.id] === 'refresh' ? 'animate-spin' : ''}`} />
                      <span className="hidden lg:inline">刷新</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(account.id, () => onToggle(account.id, account.enabled))}
                      disabled={actionLoading[account.id] === 'toggle'}
                    >
                      <Power className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">{account.enabled ? '禁用' : '启用'}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAction(account.id, () => onDelete(account.id))}
                      disabled={actionLoading[account.id] === 'delete'}
                    >
                      <Trash2 className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">删除</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
