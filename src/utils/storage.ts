import type { WatermarkConfig, ExportConfig } from '../types'
import {
  DEFAULT_WATERMARK_CONFIG,
  DEFAULT_EXPORT_CONFIG,
  DEFAULT_POSITION_CONFIG,
} from '../types'

const STORAGE_KEY = 'watermark-assistant-config'
// 配置版本号：默认预设变更时递增，旧版本配置将被忽略并使用新默认值
const CONFIG_VERSION = '3'

interface StoredConfig {
  watermark: WatermarkConfig
  exportConfig: ExportConfig
}

/** 保存配置到 localStorage */
export function saveConfig(watermark: WatermarkConfig, exportConfig: ExportConfig): void {
  try {
    const data: StoredConfig = {
      // 不保存图片水印的 data URL（太大）
      watermark: {
        ...watermark,
        image: {
          ...watermark.image,
          imageData: null,
        },
      },
      exportConfig,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CONFIG_VERSION, data }))
  } catch (e) {
    console.warn('保存配置失败', e)
  }
}

/** 从 localStorage 加载配置 */
export function loadConfig(): {
  watermark: WatermarkConfig
  exportConfig: ExportConfig
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // 版本不匹配（旧配置），忽略并使用新默认值
    if (parsed.version !== CONFIG_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    const data = parsed.data as StoredConfig
    // 合并默认值防止字段缺失
    return {
      watermark: {
        ...DEFAULT_WATERMARK_CONFIG,
        ...data.watermark,
        text: { ...DEFAULT_WATERMARK_CONFIG.text, ...data.watermark?.text },
        image: { ...DEFAULT_WATERMARK_CONFIG.image, ...data.watermark?.image },
        position: { ...DEFAULT_POSITION_CONFIG, ...data.watermark?.position },
      },
      exportConfig: { ...DEFAULT_EXPORT_CONFIG, ...data.exportConfig },
    }
  } catch (e) {
    console.warn('加载配置失败', e)
    return null
  }
}

/** 清除保存的配置 */
export function clearConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('清除配置失败', e)
  }
}
