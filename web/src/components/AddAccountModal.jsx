import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent } from './ui/card'
import { toast } from 'sonner'
import { Upload, FileJson, Key, Loader2 } from 'lucide-react'

export default function AddAccountModal({ open, onOpenChange, password, onSuccess }) {
  const [addMethod, setAddMethod] = useState('local')
  const [provider, setProvider] = useState('BuilderId')
  const [tokenJson, setTokenJson] = useState('')
  const [clientJson, setClientJson] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (addMethod === 'local') {
      await importLocalAccount()
    }
  }

  const importLocalAccount = async () => {
    if (!tokenJson.trim()) {
      toast.error('请输入Token JSON')
      return
    }

    let tokenData
    try {
      tokenData = JSON.parse(tokenJson)
    } catch {
      toast.error('Token JSON格式错误')
      return
    }

    if (!tokenData.refreshToken) {
      toast.error('Token JSON缺少refreshToken字段')
      return
    }

    const isSocial = provider === 'Google' || provider === 'Github'
    let clientData = null

    if (!isSocial) {
      if (!clientJson.trim()) {
        toast.error('请输入Client JSON')
        return
      }
      try {
        clientData = JSON.parse(clientJson)
      } catch {
        toast.error('Client JSON格式错误')
        return
      }
      if (!clientData.clientId || !clientData.clientSecret) {
        toast.error('Client JSON缺少clientId或clientSecret字段')
        return
      }
    }

    const payload = {
      refreshToken: tokenData.refreshToken,
      accessToken: tokenData.accessToken || '',
      clientId: clientData?.clientId || '',
      clientSecret: clientData?.clientSecret || '',
      authMethod: clientData ? 'idc' : 'social',
      provider: provider
    }

    setLoading(true)
    try {
      const res = await fetch('/admin/api/auth/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('导入成功: ' + (data.account?.email || data.account?.id))
        setTokenJson('')
        setClientJson('')
        onOpenChange(false)
        onSuccess()
      } else {
        toast.error('导入失败: ' + data.error)
      }
    } catch (e) {
      toast.error('导入失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md">
              <Upload className="w-5 h-5 text-white" />
            </div>
            添加账户
          </DialogTitle>
          <DialogDescription>导入 Kiro 账户凭证</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="addMethod">导入方式</Label>
            <Select value={addMethod} onValueChange={setAddMethod}>
              <SelectTrigger id="addMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">本地导入</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {addMethod === 'local' && (
            <>
              <div>
                <Label htmlFor="provider">提供商</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BuilderId">BuilderId</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Github">Github</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="border-2 border-dashed border-border/50 glass">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <FileJson className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="tokenJson" className="text-base">Token JSON</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          包含 refreshToken 和 accessToken 的 JSON 对象
                        </p>
                        <Textarea
                          id="tokenJson"
                          placeholder='{"refreshToken":"...", "accessToken":"..."}'
                          value={tokenJson}
                          onChange={(e) => setTokenJson(e.target.value)}
                          rows={6}
                          className="font-mono text-xs border-2 focus:border-blue-500 dark:focus:border-blue-400"
                        />
                      </div>
                    </div>

                    {provider !== 'Google' && provider !== 'Github' && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-md flex-shrink-0">
                          <Key className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="clientJson" className="text-base">Client JSON</Label>
                          <p className="text-xs text-muted-foreground mb-2">
                            IdC 认证需要提供 clientId 和 clientSecret
                          </p>
                          <Textarea
                            id="clientJson"
                            placeholder='{"clientId":"...", "clientSecret":"..."}'
                            value={clientJson}
                            onChange={(e) => setClientJson(e.target.value)}
                            rows={6}
                            className="font-mono text-xs border-2 focus:border-purple-500 dark:focus:border-purple-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    导入账户
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
