import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import {
  User, Mail, Key, Globe, Activity, Calendar,
  TrendingUp, Shield, Server, Hash
} from 'lucide-react'

export default function AccountDetailModal({ open, onOpenChange, account }) {
  if (!account) return null

  const formatDate = (timestamp) => {
    if (!timestamp) return '从未'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  const InfoItem = ({ icon: Icon, label, value, className = '' }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={`text-sm font-mono break-all ${className}`}>{value || '-'}</p>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            账户详情
          </DialogTitle>
          <DialogDescription>{account.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              基本信息
            </h3>
            <div className="space-y-1 bg-muted/50 rounded-lg p-4">
              <InfoItem icon={Hash} label="账户 ID" value={account.id} />
              <InfoItem icon={User} label="昵称" value={account.nickname} />
              <InfoItem icon={Mail} label="邮箱" value={account.email} />
              <InfoItem icon={Hash} label="用户 ID" value={account.userId} />
              <div className="flex items-start gap-3 py-2">
                <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">状态</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={account.enabled ? 'default' : 'secondary'}>
                      {account.enabled ? '已启用' : '已禁用'}
                    </Badge>
                    {account.subscriptionType && (
                      <Badge variant="outline">{account.subscriptionType}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 认证信息 */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Key className="w-4 h-4" />
              认证信息
            </h3>
            <div className="space-y-1 bg-muted/50 rounded-lg p-4">
              <InfoItem icon={Shield} label="认证方式" value={account.authMethod} />
              <InfoItem icon={Server} label="提供商" value={account.provider} />
              <InfoItem icon={Globe} label="区域" value={account.region} />
              <InfoItem icon={Hash} label="Machine ID" value={account.machineId} />
            </div>
          </div>

          <Separator />

          {/* 使用统计 */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              使用统计
            </h3>
            <div className="space-y-1 bg-muted/50 rounded-lg p-4">
              <InfoItem icon={TrendingUp} label="请求次数" value={account.requestCount || 0} />
              <InfoItem icon={Activity} label="错误次数" value={account.errorCount || 0} />
              <InfoItem icon={Calendar} label="最后使用" value={formatDate(account.lastUsed)} />
              <InfoItem icon={Calendar} label="最后刷新" value={formatDate(account.lastRefresh)} />
            </div>
          </div>

          {/* 可用模型 */}
          {account.availableModels && account.availableModels.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  可用模型
                </h3>
                <div className="flex flex-wrap gap-2">
                  {account.availableModels.map((model) => (
                    <Badge key={model} variant="outline" className="font-mono text-xs">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
