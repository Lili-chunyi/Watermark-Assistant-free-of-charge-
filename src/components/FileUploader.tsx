import React from 'react'
import { Upload, Spin } from 'antd'
import type { UploadProps } from 'antd'
import { InboxOutlined } from '@ant-design/icons'

export interface FileUploaderProps {
  onFiles: (files: FileList | File[]) => void
  loading?: boolean
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFiles, loading = false }) => {
  const { Dragger } = Upload

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: '.jpg,.jpeg,.png,.webp,.pdf',
    showUploadList: false,
    beforeUpload: (file, fileList) => {
      // 仅在第一个文件时触发，避免多次调用导致重复添加
      if (file === fileList[0]) {
        onFiles(fileList)
      }
      return Upload.LIST_IGNORE
    },
  }

  return (
    <div style={{ position: 'relative', minHeight: 180 }}>
      <Dragger
        {...uploadProps}
        style={{ height: 180 }}
        disabled={loading}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 132 }}>
            <Spin tip="正在处理文件..." size="large">
              <div style={{ padding: '40px 0' }} />
            </Spin>
          </div>
        ) : (
          <>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
            <p className="ant-upload-hint">
              支持 JPG、PNG、WebP 和 PDF 格式，单个文件不超过100MB
            </p>
          </>
        )}
      </Dragger>
    </div>
  )
}

export default FileUploader
