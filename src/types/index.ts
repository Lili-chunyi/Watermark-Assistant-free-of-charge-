// ===== 基础类型 =====

export type WatermarkType = 'text' | 'image'

export type FileType = 'image' | 'pdf'

export type GridPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

export type PositionMode = 'grid' | 'custom' | 'tile'

export type PageRangeMode = 'all' | 'current' | 'custom'

export type ImageExportFormat = 'original' | 'png' | 'jpg'

// ===== 配置接口 =====

export interface TextWatermarkConfig {
  text: string
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  opacity: number // 0-100
  rotation: number // 0-360
}

export interface ImageWatermarkConfig {
  imageData: string | null // base64 data URL
  scale: number // 10-200 (%)
  opacity: number // 0-100
  rotation: number // 0-360
}

export interface PositionConfig {
  mode: PositionMode
  gridPosition: GridPosition
  customX: number // 自定义位置百分比 (0-100)
  customY: number // 自定义位置百分比 (0-100)
  margin: number // 边距像素
}

export interface WatermarkConfig {
  type: WatermarkType
  text: TextWatermarkConfig
  image: ImageWatermarkConfig
  position: PositionConfig
}

export interface ExportConfig {
  imageFormat: ImageExportFormat
  customSuffix: string
}

export interface PageRangeConfig {
  mode: PageRangeMode
  customRange: string // e.g. "1,3,5-8"
}

// ===== 上传文件 =====

export interface UploadedFile {
  id: string
  file: File
  name: string
  type: FileType
  size: number
  url: string // ObjectURL for image preview
  pageCount: number
  currentPage: number
}

// ===== 默认配置 =====

export const DEFAULT_TEXT_CONFIG: TextWatermarkConfig = {
  text: '机密',
  fontSize: 60,
  color: '#808080',
  bold: false,
  italic: false,
  opacity: 30,
  rotation: -30,
}

export const DEFAULT_IMAGE_CONFIG: ImageWatermarkConfig = {
  imageData: null,
  scale: 100,
  opacity: 30,
  rotation: 0,
}

export const DEFAULT_POSITION_CONFIG: PositionConfig = {
  mode: 'tile',
  gridPosition: 'center',
  customX: 50,
  customY: 50,
  margin: 100,
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  type: 'text',
  text: { ...DEFAULT_TEXT_CONFIG },
  image: { ...DEFAULT_IMAGE_CONFIG },
  position: { ...DEFAULT_POSITION_CONFIG },
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  imageFormat: 'original',
  customSuffix: '_watermarked',
}

export const DEFAULT_PAGE_RANGE_CONFIG: PageRangeConfig = {
  mode: 'all',
  customRange: '',
}

export const PRESET_TEXTS = [
  '机密',
  '草稿',
  '禁止转载',
  '版权所有',
  'Sample',
  'Confidential',
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

export const ACCEPTED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

// 九宫格位置列表
export const GRID_POSITIONS: { key: GridPosition; label: string }[] = [
  { key: 'top-left', label: '左上' },
  { key: 'top-center', label: '中上' },
  { key: 'top-right', label: '右上' },
  { key: 'middle-left', label: '左中' },
  { key: 'center', label: '居中' },
  { key: 'middle-right', label: '右中' },
  { key: 'bottom-left', label: '左下' },
  { key: 'bottom-center', label: '中下' },
  { key: 'bottom-right', label: '右下' },
]
