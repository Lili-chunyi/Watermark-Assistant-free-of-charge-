import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  WatermarkConfig,
  ExportConfig,
  PageRangeConfig,
  TextWatermarkConfig,
  ImageWatermarkConfig,
  PositionConfig,
  WatermarkType,
} from '../types'
import {
  DEFAULT_WATERMARK_CONFIG,
  DEFAULT_EXPORT_CONFIG,
  DEFAULT_PAGE_RANGE_CONFIG,
} from '../types'
import { saveConfig, loadConfig, clearConfig } from '../utils/storage'

export function useWatermark() {
  const loaded = loadConfig()

  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>(
    loaded?.watermark ?? { ...DEFAULT_WATERMARK_CONFIG },
  )
  const [exportConfig, setExportConfig] = useState<ExportConfig>(
    loaded?.exportConfig ?? { ...DEFAULT_EXPORT_CONFIG },
  )
  const [pageRangeConfig, setPageRangeConfig] = useState<PageRangeConfig>(
    { ...DEFAULT_PAGE_RANGE_CONFIG },
  )

  // 防抖保存
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveConfig(watermarkConfig, exportConfig)
    }, 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [watermarkConfig, exportConfig])

  const updateTextConfig = useCallback((updates: Partial<TextWatermarkConfig>) => {
    setWatermarkConfig((prev) => ({
      ...prev,
      text: { ...prev.text, ...updates },
    }))
  }, [])

  const updateImageConfig = useCallback((updates: Partial<ImageWatermarkConfig>) => {
    setWatermarkConfig((prev) => ({
      ...prev,
      image: { ...prev.image, ...updates },
    }))
  }, [])

  const updatePositionConfig = useCallback((updates: Partial<PositionConfig>) => {
    setWatermarkConfig((prev) => ({
      ...prev,
      position: { ...prev.position, ...updates },
    }))
  }, [])

  const setWatermarkType = useCallback((type: WatermarkType) => {
    setWatermarkConfig((prev) => ({ ...prev, type }))
  }, [])

  const updateExportConfig = useCallback((updates: Partial<ExportConfig>) => {
    setExportConfig((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetConfig = useCallback(() => {
    setWatermarkConfig({ ...DEFAULT_WATERMARK_CONFIG })
    setExportConfig({ ...DEFAULT_EXPORT_CONFIG })
    setPageRangeConfig({ ...DEFAULT_PAGE_RANGE_CONFIG })
    clearConfig()
  }, [])

  return {
    watermarkConfig,
    setWatermarkConfig,
    exportConfig,
    setExportConfig: updateExportConfig,
    pageRangeConfig,
    setPageRangeConfig,
    updateTextConfig,
    updateImageConfig,
    updatePositionConfig,
    setWatermarkType,
    resetConfig,
  }
}
