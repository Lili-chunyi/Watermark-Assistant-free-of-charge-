import type { WatermarkConfig, ImageExportFormat } from '../types'
import {
  drawTextWatermark,
  drawImageWatermark,
  loadImage,
} from './watermark'

/** 加载图片文件为 HTMLImageElement */
export async function loadImageFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    return img
  } finally {
    // 不在这里 revoke，因为 loadImage 已经加载完毕
    // 但为了安全，延迟 revoke
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

/** 创建与图片等大的 Canvas 并绘制原图 */
function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  return canvas
}

/** 在已有 Canvas 上绘制水印（预览用） */
export async function drawWatermarkOnCanvas(
  canvas: HTMLCanvasElement,
  watermarkConfig: WatermarkConfig,
): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas

  if (watermarkConfig.type === 'text') {
    drawTextWatermark(ctx, width, height, watermarkConfig.text, watermarkConfig.position)
  } else {
    if (!watermarkConfig.image.imageData) return
    const imgEl = await loadImage(watermarkConfig.image.imageData)
    drawImageWatermark(ctx, width, height, imgEl, watermarkConfig.image, watermarkConfig.position)
  }
}

/** Canvas 转 Blob */
function canvasToBlob(canvas: HTMLCanvasElement, format: ImageExportFormat, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mime = format === 'jpg' ? 'image/jpeg' : format === 'png' ? 'image/png' : 'image/png'
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      mime,
      quality,
    )
  })
}

/**
 * 处理图片文件：加载 → 绘制原图到 Canvas → 叠加水印 → 导出
 * @returns 带水印的图片 Blob
 */
export async function processImageFile(
  file: File,
  watermarkConfig: WatermarkConfig,
  exportFormat: ImageExportFormat,
): Promise<Blob> {
  const imgEl = await loadImageFile(file)
  const canvas = imageToCanvas(imgEl)
  await drawWatermarkOnCanvas(canvas, watermarkConfig)

  // 决定导出格式
  const format: ImageExportFormat =
    exportFormat === 'original'
      ? file.type === 'image/png'
        ? 'png'
        : file.type === 'image/webp'
          ? 'png' // webp 不通用，转 png
          : 'jpg'
      : exportFormat

  return canvasToBlob(canvas, format)
}

/** 获取图片文件的宽高（用于预览比例） */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const imgEl = await loadImageFile(file)
  return { width: imgEl.naturalWidth, height: imgEl.naturalHeight }
}
