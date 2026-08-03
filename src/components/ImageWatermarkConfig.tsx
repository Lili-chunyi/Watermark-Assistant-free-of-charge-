import React from 'react'
import { Upload, Button, Slider, InputNumber } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ImageWatermarkConfig } from '../types'
import { fileToDataURL } from '../utils/watermark'

export interface ImageWatermarkConfigProps {
  config: ImageWatermarkConfig
  onChange: (updates: Partial<ImageWatermarkConfig>) => void
}

// Slider 值兼容 number | number[]
const toNumber = (value: number | number[]): number =>
  Array.isArray(value) ? value[0] : value

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#999',
  marginBottom: 4,
}

const fieldStyle: React.CSSProperties = {
  marginBottom: 12,
}

const ImageWatermarkConfig: React.FC<ImageWatermarkConfigProps> = ({
  config,
  onChange,
}) => {
  // 读取文件为 DataURL 并存入 imageData
  const handleBeforeUpload = (file: File) => {
    fileToDataURL(file).then((dataUrl) => {
      onChange({ imageData: dataUrl })
    })
    return false
  }

  return (
    <div className="config-section">
      {/* 上传水印图片 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>上传水印图片</label>
        <Upload
          accept=".png,.jpg,.svg"
          beforeUpload={handleBeforeUpload}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>选择图片</Button>
        </Upload>
        {config.imageData ? (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <img
              src={config.imageData}
              alt="水印预览"
              style={{
                maxWidth: '100%',
                maxHeight: 120,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
              }}
            />
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onChange({ imageData: null })}
            >
              清除
            </Button>
          </div>
        ) : (
          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            支持 PNG、JPG、SVG 格式
          </div>
        )}
      </div>

      {/* 水印缩放 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>水印缩放：{config.scale}%</label>
        <Slider
          min={10}
          max={200}
          value={config.scale}
          onChange={(value) => onChange({ scale: toNumber(value) })}
        />
      </div>

      {/* 透明度 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>透明度：{config.opacity}%</label>
        <Slider
          min={0}
          max={100}
          value={config.opacity}
          onChange={(value) => onChange({ opacity: toNumber(value) })}
        />
      </div>

      {/* 旋转角度 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>旋转角度</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Slider
            min={0}
            max={360}
            value={config.rotation}
            onChange={(value) => onChange({ rotation: toNumber(value) })}
            style={{ flex: 1 }}
          />
          <InputNumber
            min={0}
            max={360}
            value={config.rotation}
            onChange={(value) => onChange({ rotation: value ?? 0 })}
            style={{ width: 80 }}
          />
        </div>
      </div>
    </div>
  )
}

export default ImageWatermarkConfig
