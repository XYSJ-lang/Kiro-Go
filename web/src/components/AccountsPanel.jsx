import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import {
  RefreshCw, Trash2, Power, Plus, Search,
  Eye, Loader2, AlertCircle, CheckCircle2,
  TrendingUp, Users, Activity, Download,
  Check, X, Copy, Mail, Clock, ChevronDown, ChevronUp
} from 'lucide-react'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { exportToJSON, exportToCSV, copyToClipboard } from '../lib/utils'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  getQuota,
  getUsed,
  getUsagePercent,
  getSubPlan,
  formatUsage,
  hasOverage,
  isOverageEnabled,
  getOverageUsed,
  getOverageCap,
  getOverageCharges,
  getOverageRate,
  getBreakdown
} from '../lib/accountStats'

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
  onShowDetail,
  onBatchEnable,
  onBatchDisable,
  onBatchDelete,
  searchInputRef,
  selectedAccounts = [],
  onSelectedAccountsChange
}) {
  const [actionLoading, setActionLoading] = useState({})
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('lastUsed')
  const [expandedCards, setExpandedCards] = useState({}) // 记录哪些卡片展开了用量详情

  const toggleCardExpand = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const selectedIds = selectedAccounts
  const setSelectedIds = onSelectedAccountsChange || (() => {})

  const handleAction = async (id, action) => {
    setActionLoading({ ...actionLoading, [id]: action })
    await action()
    setActionLoading({ ...actionLoading, [id]: null })
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAccounts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredAccounts.map(a => a.id))
    }
  }

  const handleBatchAction = async (action) => {
    if (selectedIds.length === 0) return
    await action(selectedIds)
    setSelectedIds([])
  }

  const handleExportJSON = () => {
    const exportData = filteredAccounts.map(acc => ({
      id: acc.id,
      email: acc.email,
      nickname: acc.nickname,
      enabled: acc.enabled,
      subscriptionType: acc.subscriptionType,
      authMethod: acc.authMethod,
      provider: acc.provider,
      requestCount: acc.requestCount,
      lastUsed: acc.lastUsed
    }))
    exportToJSON(exportData, `accounts-${new Date().toISOString().split('T')[0]}.json`)
    toast.success('已导出为 JSON 文件')
  }

  const handleExportCSV = () => {
    const exportData = filteredAccounts.map(acc => ({
      ID: acc.id,
      邮箱: acc.email,
      昵称: acc.nickname || '',
      状态: acc.enabled ? '已启用' : '已禁用',
      订阅类型: acc.subscriptionType || 'Free',
      认证方式: acc.authMethod === 'idc' ? 'IdC' : 'Social',
      提供商: acc.provider || '',
      请求次数: acc.requestCount || 0,
      最后使用: acc.lastUsed ? new Date(acc.lastUsed * 1000).toLocaleString('zh-CN') : '从未'
    }))
    exportToCSV(exportData, `accounts-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('已导出为 CSV 文件')
  }

  const handleCopyId = (id) => {
    copyToClipboard(id)
      .then(() => toast.success('已复制账户 ID'))
      .catch(() => toast.error('复制失败'))
  }

  let filteredAccounts = accounts.filter(acc => {
    const matchesSearch = !searchTerm ||
      acc.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.id?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'enabled' && acc.enabled) ||
      (filterStatus === 'disabled' && !acc.enabled) ||
      (filterStatus === 'pro' && acc.subscriptionType?.includes('Pro'))

    return matchesSearch && matchesFilter
  })

  // 排序
  filteredAccounts = [...filteredAccounts].sort((a, b) => {
    switch (sortBy) {
      case 'lastUsed':
        return (b.lastUsed || 0) - (a.lastUsed || 0)
      case 'email':
        return (a.email || '').localeCompare(b.email || '')
      case 'requests':
        return (b.requestCount || 0) - (a.requestCount || 0)
      case 'usage':
        const aUsage = a.usageCurrent / a.usageLimit || 0
        const bUsage = b.usageCurrent / b.usageLimit || 0
        return bUsage - aUsage
      default:
        return 0
    }
  })

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card
          className="card-hover cursor-pointer border-0 shadow-md glass overflow-hidden group relative"
          onClick={() => setFilterStatus('all')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-4 pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">总账户</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-hover cursor-pointer border-0 shadow-md glass overflow-hidden group relative"
          onClick={() => setFilterStatus('enabled')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-4 pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">已启用</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.enabled}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-hover cursor-pointer border-0 shadow-md glass overflow-hidden group relative"
          onClick={() => setFilterStatus('disabled')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-4 pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">已禁用</p>
                <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{stats.disabled}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center shadow-md">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="card-hover cursor-pointer border-0 shadow-md glass overflow-hidden group relative"
          onClick={() => setFilterStatus('pro')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-4 pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Pro 账户</p>
                <p className="text-2xl font-bold text-gradient">{stats.pro}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作栏 */}
      <Card className="border-0 shadow-md glass">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="搜索账户（邮箱、昵称、ID）..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 w-full border-2 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastUsed">最后使用</SelectItem>
                    <SelectItem value="email">邮箱</SelectItem>
                    <SelectItem value="requests">请求数</SelectItem>
                    <SelectItem value="usage">用量</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-2">
                      <Download className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">导出</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass">
                    <DropdownMenuLabel>导出格式</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportJSON}>
                      导出为 JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      导出为 CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={onRefresh} variant="outline" disabled={loading} className="border-2 btn-scale">
                  <RefreshCw className={`w-4 h-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">刷新</span>
                </Button>
                <Button
                  onClick={onAdd}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all btn-scale"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">添加</span>
                </Button>
              </div>
            </div>

            {/* 批量操作栏 */}
            {selectedIds.length > 0 && (
              <div className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg p-4 animate-in slide-in-from-top-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedIds.length === filteredAccounts.length}
                      onCheckedChange={toggleSelectAll}
                      className="border-2"
                    />
                    <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      已选择 {selectedIds.length} 个账户
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchAction(async (ids) => {
                        await Promise.all(ids.map(id => onRefreshAccount(id)))
                        toast.success(`已刷新 ${ids.length} 个账户`)
                      })}
                      className="border-2 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 btn-scale"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      批量刷新
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchAction(onBatchEnable)}
                      className="border-2 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 btn-scale"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      批量启用
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBatchAction(onBatchDisable)}
                      className="border-2 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950/30 btn-scale"
                    >
                      <X className="w-4 h-4 mr-1" />
                      批量禁用
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBatchAction(onBatchDelete)}
                      className="shadow-md hover:shadow-lg btn-scale"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      批量删除
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              {searchTerm || filterStatus !== 'all' ? '未找到匹配的账户' : '暂无账户'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button onClick={onAdd} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                添加第一个账户
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAccounts.map((account, index) => {
            const breakdown = getBreakdown(account)
            const quota = getQuota(account)
            const used = getUsed(account)
            const percent = getUsagePercent(account)
            const hasOverageUsage = hasOverage(account)
            const overageEnabled = isOverageEnabled(account)
            const overageUsed = getOverageUsed(account)
            const overageCap = getOverageCap(account)
            const overageCharges = getOverageCharges(account)
            const overageRate = getOverageRate(account)
            const isHighUsage = percent > 80
            const isCriticalUsage = percent > 90
            // 检查超额资格
            const hasOverageCapability = account.usageData?.subscriptionInfo?.overageCapability === 'OVERAGE_CAPABLE'

            return (
              <Card
                key={account.id}
                className="card-hover border-0 shadow-md glass overflow-hidden group relative animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* 顶部装饰条 */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  account.enabled
                    ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                }`} />

                <CardContent className="pt-2 pb-2">
                  <div className="flex gap-2">
                    {/* 左侧：头像和选择框 */}
                    <div className="flex flex-col items-center gap-1.5">
                      <Checkbox
                        checked={selectedIds.includes(account.id)}
                        onCheckedChange={() => toggleSelect(account.id)}
                        className="border"
                      />
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm ${
                          (account.usageData?.subscriptionInfo?.type || '').toUpperCase().includes('PRO')
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                            : 'bg-gradient-to-br from-gray-500 to-gray-600'
                        }`}>
                          {(account.nickname || account.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        {/* 状态指示器 */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-gray-900 ${
                          account.enabled ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {account.enabled && (
                            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 中间：主要信息 */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* 标题行 */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="font-bold text-sm truncate">
                              {account.nickname || account.email}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 px-1 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                              onClick={() => handleCopyId(account.id)}
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" />
                            {account.email}
                          </p>
                        </div>

                        {/* 徽章组 */}
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Badge
                            className={`text-xs h-5 ${
                              (account.usageData?.subscriptionInfo?.type || '').toUpperCase().includes('PRO')
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {account.usageData?.subscriptionInfo?.subscriptionTitle ||
                             account.usageData?.subscriptionInfo?.type ||
                             account.subscriptionType ||
                             'Free'}
                          </Badge>
                          {account.enabled ? (
                            <Badge className="text-xs h-5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700 border">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                              已启用
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs h-5 text-gray-500 dark:text-gray-400 border-gray-400 dark:border-gray-600">
                              已禁用
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* 统计数据网格 */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded p-1.5 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-1 mb-0.5">
                            <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">请求数</span>
                          </div>
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                            {account.requestCount || 0}
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded p-1.5 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Activity className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">认证</span>
                          </div>
                          <p className="text-xs font-bold text-purple-900 dark:text-purple-100">
                            {account.authMethod === 'idc' ? 'IdC' : 'Social'}
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded p-1.5 border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
                            <span className="text-xs text-green-700 dark:text-green-300 font-medium">最后使用</span>
                          </div>
                          <p className="text-xs font-semibold text-green-900 dark:text-green-100 truncate">
                            {formatDate(account.lastUsed)}
                          </p>
                        </div>
                      </div>

                      {/* 用量和额度详情 */}
                      {breakdown && (
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700 space-y-1">
                          {/* 标题行 */}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              <div className={`w-5 h-5 rounded flex items-center justify-center ${
                                hasOverageUsage ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                isCriticalUsage ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                isHighUsage ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                                'bg-gradient-to-br from-purple-600 to-pink-600'
                              }`}>
                                <Activity className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex items-center gap-1">
                                <p className="text-xs font-bold">
                                  {breakdown.displayName || breakdown.resourceType || 'Usage'}
                                </p>
                                {breakdown.currency && (
                                  <span className="text-xs px-1 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                                    {breakdown.currency}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 超额状态徽章 */}
                            {overageEnabled && (
                              <Badge className="text-xs h-4 px-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                                超额
                              </Badge>
                            )}
                          </div>

                          {/* 额度统计 */}
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">已使用</p>
                              <p className={`text-xs font-bold ${
                                hasOverageUsage ? 'text-purple-600 dark:text-purple-400' :
                                isCriticalUsage ? 'text-red-600 dark:text-red-400' :
                                isHighUsage ? 'text-orange-600 dark:text-orange-400' :
                                'text-foreground'
                              }`}>
                                {formatUsage(used)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">剩余</p>
                              <p className="text-xs font-bold text-green-600 dark:text-green-400">
                                {formatUsage(Math.max(0, quota - used))}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">总额度</p>
                              <p className="text-xs font-bold">
                                {formatUsage(quota)}
                              </p>
                            </div>
                          </div>

                          {/* 进度条 */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                {hasOverageUsage ? '超额使用' : '使用进度'}
                              </span>
                              <span className={`font-semibold ${
                                hasOverageUsage ? 'text-purple-600 dark:text-purple-400' :
                                isCriticalUsage ? 'text-red-600 dark:text-red-400' :
                                isHighUsage ? 'text-orange-600 dark:text-orange-400' :
                                'text-foreground'
                              }`}>
                                {hasOverageUsage ? '超额' : `${percent.toFixed(1)}%`}
                              </span>
                            </div>
                            <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  hasOverageUsage
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                    : isCriticalUsage
                                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                                    : isHighUsage
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                                }`}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* 超额信息 - 只有具备超额资格的账号才显示 */}
                          {hasOverageCapability && overageRate > 0 && (
                            <div className="pt-1.5 border-t border-gray-300 dark:border-gray-600 space-y-1">
                              {/* 超额配置信息 */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">超额费率</span>
                                <span className="font-semibold">
                                  {breakdown.currency || 'USD'} {overageRate}/credit
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">超额上限</span>
                                <span className="font-semibold">
                                  {formatUsage(overageCap)} {breakdown.unit?.toLowerCase() || 'credits'}
                                </span>
                              </div>

                              {/* 当前超额使用 */}
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-300 dark:border-gray-600">
                                <span className={hasOverageUsage ? "text-purple-600 dark:text-purple-400 font-bold" : "text-muted-foreground"}>
                                  当前超额
                                </span>
                                <span className={hasOverageUsage ? "font-bold text-purple-600 dark:text-purple-400" : "text-muted-foreground"}>
                                  {formatUsage(overageUsed)} / {formatUsage(overageCap)}
                                </span>
                              </div>

                              {/* 超额进度条 */}
                              <div className="h-1.5 rounded-full bg-purple-500/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                                  style={{ width: `${overageCap > 0 ? Math.min((overageUsed / overageCap) * 100, 100) : 0}%` }}
                                />
                              </div>

                              {/* 超额费用 */}
                              {overageCharges > 0 && (
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-300 dark:border-gray-600">
                                  <span className="text-muted-foreground">超额费用</span>
                                  <span className="font-bold text-red-600 dark:text-red-400">
                                    {breakdown.currency || 'USD'} {overageCharges.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 重置时间 */}
                          {breakdown.nextDateReset && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1.5 border-t border-gray-300 dark:border-gray-600">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(breakdown.nextDateReset * 1000).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => onShowDetail(account.id)}
                        className="border-2 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 btn-scale"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleAction(account.id, () => onToggle(account.id, account.enabled))}
                        disabled={actionLoading[account.id] === 'toggle'}
                        className={`border-2 btn-scale ${
                          account.enabled
                            ? 'hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                            : 'hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30'
                        }`}
                        title={account.enabled ? '禁用账户' : '启用账户'}
                      >
                        {actionLoading[account.id] === 'toggle' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleAction(account.id, () => onRefreshAccount(account.id))}
                        disabled={actionLoading[account.id] === 'refresh'}
                        className="border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 btn-scale"
                        title="刷新账户信息"
                      >
                        {actionLoading[account.id] === 'refresh' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => onDelete(account.id)}
                        className="shadow-md hover:shadow-lg btn-scale"
                        title="删除账户"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
