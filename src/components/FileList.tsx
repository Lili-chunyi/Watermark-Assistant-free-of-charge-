import React from 'react'
import { Empty, Tooltip, Button } from 'antd'
import {
  FileOutlined,
  FileImageOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import type { UploadedFile } from '../types'

export interface FileListProps {
  files: UploadedFile[]
  selectedFileId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onDownload: (id: string) => void
  processingIds: Set<string>
}

// 文件大小格式化: <1KB显示B, <1MB显示KB, 否则显示MB
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const FileList: React.FC<FileListProps> = ({
  files,
  selectedFileId,
  onSelect,
  onRemove,
  onDownload,
  processingIds,
}) => {
  if (files.length === 0) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Empty description="暂无文件，请先上传" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {files.map((file) => {
        const isSelected = file.id === selectedFileId
        const isProcessing = processingIds.has(file.id)

        return (
          <div
            key={file.id}
            onClick={() => onSelect(file.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 48,
              padding: '0 12px',
              borderRadius: 6,
              border: `1px solid ${isSelected ? '#1677ff' : '#f0f0f0'}`,
              background: isSelected ? '#e6f4ff' : '#fafafa',
              cursor: 'pointer',
              transition: 'all 0.2s',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18, color: file.type === 'pdf' ? '#ff4d4f' : '#1677ff' }}>
              {file.type === 'pdf' ? <FileOutlined /> : <FileImageOutlined />}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={file.name}
              >
                {file.name}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {formatBytes(file.size)}
                {file.type === 'pdf' && file.pageCount > 0 ? ` · 共 ${file.pageCount} 页` : ''}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <Tooltip title="下载">
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  loading={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDownload(file.id)
                  }}
                />
              </Tooltip>
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(file.id)
                  }}
                />
              </Tooltip>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default FileList
