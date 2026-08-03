import React from 'react'
import { Radio, Input } from 'antd'
import type { PageRangeConfig, PageRangeMode } from '../types'

export interface PdfPageConfigProps {
  config: PageRangeConfig
  onChange: (updates: Partial<PageRangeConfig>) => void
  totalPages: number
  currentPage: number
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#999',
  marginBottom: 4,
}

const fieldStyle: React.CSSProperties = {
  marginBottom: 12,
}

const PdfPageConfig: React.FC<PdfPageConfigProps> = ({
  config,
  onChange,
  totalPages,
  currentPage,
}) => {
  return (
    <div className="config-section">
      {/* 页面范围模式 */}
      <div style={fieldStyle}>
        <label style={labelStyle}>页面范围</label>
        <Radio.Group
          value={config.mode}
          onChange={(e) => onChange({ mode: e.target.value as PageRangeMode })}
        >
          <Radio value="all">全部页面</Radio>
          <Radio value="current">当前页面</Radio>
          <Radio value="custom">指定页码范围</Radio>
        </Radio.Group>
      </div>

      {/* 当前页 / 总页数 */}
      <div style={fieldStyle}>
        <div style={{ fontSize: 13, color: '#666' }}>
          当前预览: 第 {currentPage} 页 / 共 {totalPages} 页
        </div>
      </div>

      {/* 指定页码范围 */}
      {config.mode === 'custom' && (
        <div style={fieldStyle}>
          <label style={labelStyle}>页码范围</label>
          <Input
            value={config.customRange}
            onChange={(e) => onChange({ customRange: e.target.value })}
            placeholder="如: 1,3,5-8"
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* 帮助说明 */}
      <div style={{ fontSize: 12, color: '#999', lineHeight: 1.6 }}>
        支持格式：单个页码（如 1）、逗号分隔多个页码（如 1,3,5）、范围（如 5-8），可组合使用（如 1,3,5-8）
      </div>
    </div>
  )
}

export default PdfPageConfig
