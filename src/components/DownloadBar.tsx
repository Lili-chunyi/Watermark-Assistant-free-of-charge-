import React from 'react'
import { Button, Select, Input, Progress, Card, Space } from 'antd'
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ExportConfig, ImageExportFormat } from '../types'

export interface DownloadBarProps {
  onDownloadAll: () => void
  onReset: () => void
  fileCount: number
  progress: { current: number; total: number } | null
  exportConfig: ExportConfig
  onExportConfigChange: (updates: Partial<ExportConfig>) => void
}

const FORMAT_OPTIONS: { label: string; value: ImageExportFormat }[] = [
  { label: '原格式', value: 'original' },
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpg' },
]

const DownloadBar: React.FC<DownloadBarProps> = ({
  onDownloadAll,
  onReset,
  fileCount,
  progress,
  exportConfig,
  onExportConfigChange,
}) => {
  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 顶部操作按钮 */}
      <Space>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          disabled={fileCount === 0}
          onClick={onDownloadAll}
        >
          全部下载
        </Button>
        <Button icon={<ReloadOutlined />} onClick={onReset}>
          重置参数
        </Button>
      </Space>

      {/* 导出设置 */}
      <Card size="small" title="导出设置">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flexShrink: 0, width: 90 }}>图片导出格式</span>
            <Select
              value={exportConfig.imageFormat}
              style={{ width: 160 }}
              options={FORMAT_OPTIONS}
              onChange={(value: ImageExportFormat) =>
                onExportConfigChange({ imageFormat: value })
              }
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Input
              addonBefore="文件名后缀"
              value={exportConfig.customSuffix}
              placeholder="_watermarked"
              onChange={(e) =>
                onExportConfigChange({ customSuffix: e.target.value })
              }
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </Card>

      {/* 进度条 */}
      {progress && (
        <div>
          <div style={{ marginBottom: 6, fontSize: 13 }}>
            正在处理: {progress.current}/{progress.total}
          </div>
          <Progress percent={progressPercent} status="active" />
        </div>
      )}
    </div>
  )
}

export default DownloadBar
