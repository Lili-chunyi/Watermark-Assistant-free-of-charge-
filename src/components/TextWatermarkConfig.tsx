import React from 'react'
import { Input, Button, Slider, InputNumber, ColorPicker, Space } from 'antd'
import { BoldOutlined, ItalicOutlined } from '@ant-design/icons'
import type { TextWatermarkConfig } from '../types'
import { PRESET_TEXTS } from '../types'

export interface TextWatermarkConfigProps {
  config: TextWatermarkConfig
  onChange: (updates: Partial<TextWatermarkConfig>) => void
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

const TextWatermarkConfig: React.FC<TextWatermarkConfigProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="config-section">
      {/* 文字内容 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>文字内容</label>
        <Input.TextArea
          value={config.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="请输入水印文字"
          autoSize={{ minRows: 2, maxRows: 4 }}
        />
      </div>

      {/* 快捷文字 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>快捷文字</label>
        <Space wrap>
          {PRESET_TEXTS.map((text) => (
            <Button key={text} size="small" onClick={() => onChange({ text })}>
              {text}
            </Button>
          ))}
        </Space>
      </div>

      {/* 字体大小 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>字体大小</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Slider
            min={10}
            max={200}
            value={config.fontSize}
            onChange={(value) => onChange({ fontSize: toNumber(value) })}
            style={{ flex: 1 }}
          />
          <InputNumber
            min={10}
            max={200}
            value={config.fontSize}
            onChange={(value) => onChange({ fontSize: value ?? 60 })}
            style={{ width: 80 }}
          />
        </div>
      </div>

      {/* 字体颜色 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>字体颜色</label>
        <ColorPicker
          value={config.color}
          onChange={(color) => onChange({ color: color.toHexString() })}
        />
      </div>

      {/* 字体样式 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>字体样式</label>
        <Space>
          <Button
            type={config.bold ? 'primary' : 'default'}
            icon={<BoldOutlined />}
            onClick={() => onChange({ bold: !config.bold })}
          >
            加粗
          </Button>
          <Button
            type={config.italic ? 'primary' : 'default'}
            icon={<ItalicOutlined />}
            onClick={() => onChange({ italic: !config.italic })}
          >
            斜体
          </Button>
        </Space>
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
            min={-360}
            max={360}
            value={config.rotation}
            onChange={(value) => onChange({ rotation: toNumber(value) })}
            style={{ flex: 1 }}
          />
          <InputNumber
            min={-360}
            max={360}
            value={config.rotation}
            onChange={(value) => onChange({ rotation: value ?? -30 })}
            style={{ width: 80 }}
          />
        </div>
      </div>
    </div>
  )
}

export default TextWatermarkConfig
