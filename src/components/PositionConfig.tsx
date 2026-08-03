import React from 'react'
import { Radio, Button, Slider, Alert } from 'antd'
import type { PositionConfig, PositionMode } from '../types'
import { GRID_POSITIONS } from '../types'

export interface PositionConfigProps {
  config: PositionConfig
  onChange: (updates: Partial<PositionConfig>) => void
  isPdf: boolean
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

const PositionConfig: React.FC<PositionConfigProps> = ({
  config,
  onChange,
  isPdf,
}) => {
  return (
    <div className="config-section">
      {/* 位置模式 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>位置模式</label>
        <Radio.Group
          value={config.mode}
          onChange={(e) => onChange({ mode: e.target.value as PositionMode })}
        >
          <Radio value="grid">九宫格位置</Radio>
          <Radio value="custom">自定义位置</Radio>
          <Radio value="tile">平铺模式</Radio>
        </Radio.Group>
      </div>

      {/* 九宫格 */}
      {config.mode === 'grid' && (
        <div style={fieldStyle}>
          <label style={labelStyle}>选择位置</label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {GRID_POSITIONS.map((pos) => (
              <Button
                key={pos.key}
                type={config.gridPosition === pos.key ? 'primary' : 'default'}
                onClick={() => onChange({ gridPosition: pos.key })}
              >
                {pos.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 自定义位置提示 */}
      {config.mode === 'custom' && (
        <div style={fieldStyle}>
          <Alert
            type="info"
            showIcon
            message={
              isPdf
                ? 'PDF预览模式下暂不支持拖拽，将使用默认居中位置'
                : '请在预览区域拖拽水印到目标位置'
            }
          />
        </div>
      )}

      {/* 边距 / 平铺间距（仅 grid 和 tile 模式显示） */}
      {(config.mode === 'grid' || config.mode === 'tile') && (
        <div style={fieldStyle}>
          <label style={labelStyle}>
            {config.mode === 'tile'
              ? `平铺间距：${config.margin}px`
              : `边距：${config.margin}px`}
          </label>
          <Slider
            min={0}
            max={500}
            value={config.margin}
            onChange={(value) => onChange({ margin: toNumber(value) })}
          />
          {config.mode === 'tile' && (
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              控制水印之间的间距，值越大间距越宽
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PositionConfig
