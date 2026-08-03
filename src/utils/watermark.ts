import type {
  TextWatermarkConfig,
  ImageWatermarkConfig,
  PositionConfig,
  GridPosition,
} from '../types'

/** 计算九宫格位置（Canvas坐标系，左上角原点） */
export function calculateGridPosition(
  gridPos: GridPosition,
  canvasW: number,
  canvasH: number,
  wmW: number,
  wmH: number,
  margin: number,
): { x: number; y: number } {
  const centerX = canvasW / 2
  const centerY = canvasH / 2

  const map: Record<GridPosition, { x: number; y: number }> = {
    'top-left': { x: margin, y: margin },
    'top-center': { x: centerX - wmW / 2, y: margin },
    'top-right': { x: canvasW - wmW - margin, y: margin },
    'middle-left': { x: margin, y: centerY - wmH / 2 },
    'center': { x: centerX - wmW / 2, y: centerY - wmH / 2 },
    'middle-right': { x: canvasW - wmW - margin, y: centerY - wmH / 2 },
    'bottom-left': { x: margin, y: canvasH - wmH - margin },
    'bottom-center': { x: centerX - wmW / 2, y: canvasH - wmH - margin },
    'bottom-right': { x: canvasW - wmW - margin, y: canvasH - wmH - margin },
  }
  return map[gridPos] ?? map['center']
}

/** 在 Canvas 上绘制单个旋转水印（文字或图片），以中心点为旋转中心 */
function drawRotated(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: number,
  draw: () => void,
): void {
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate((rotation * Math.PI) / 180)
  draw()
  ctx.restore()
}

/** 在 Canvas 上绘制文字水印 */
export function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  config: TextWatermarkConfig,
  position: PositionConfig,
): void {
  const { text, fontSize, color, bold, italic, opacity, rotation } = config
  if (!text) return

  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity / 100))
  ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px Arial, "Microsoft YaHei", "PingFang SC", sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const metrics = ctx.measureText(text)
  const wmW = metrics.width
  const wmH = fontSize

  const drawText = () => {
    ctx.fillText(text, 0, 0)
  }

  if (position.mode === 'tile') {
    const stepX = wmW + position.margin * 2
    const stepY = wmH + position.margin * 2
    // 额外偏移以确保旋转后边缘也覆盖
    const extra = Math.max(wmW, wmH)
    for (let y = -extra; y < canvasH + extra; y += stepY) {
      for (let x = -extra; x < canvasW + extra; x += stepX) {
        drawRotated(ctx, x + wmW / 2, y + wmH / 2, rotation, drawText)
      }
    }
  } else if (position.mode === 'custom') {
    const cx = (position.customX / 100) * canvasW
    const cy = (position.customY / 100) * canvasH
    drawRotated(ctx, cx, cy, rotation, drawText)
  } else {
    const { x, y } = calculateGridPosition(
      position.gridPosition, canvasW, canvasH, wmW, wmH, position.margin,
    )
    drawRotated(ctx, x + wmW / 2, y + wmH / 2, rotation, drawText)
  }

  ctx.restore()
}

/** 在 Canvas 上绘制图片水印 */
export function drawImageWatermark(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  imageEl: HTMLImageElement,
  config: ImageWatermarkConfig,
  position: PositionConfig,
): void {
  const { scale, opacity, rotation } = config
  const wmW = imageEl.naturalWidth * (scale / 100)
  const wmH = imageEl.naturalHeight * (scale / 100)

  if (wmW < 1 || wmH < 1) return

  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity / 100))

  const drawImg = () => {
    ctx.drawImage(imageEl, -wmW / 2, -wmH / 2, wmW, wmH)
  }

  if (position.mode === 'tile') {
    const stepX = wmW + position.margin * 2
    const stepY = wmH + position.margin * 2
    const extra = Math.max(wmW, wmH)
    for (let y = -extra; y < canvasH + extra; y += stepY) {
      for (let x = -extra; x < canvasW + extra; x += stepX) {
        drawRotated(ctx, x + wmW / 2, y + wmH / 2, rotation, drawImg)
      }
    }
  } else if (position.mode === 'custom') {
    const cx = (position.customX / 100) * canvasW
    const cy = (position.customY / 100) * canvasH
    drawRotated(ctx, cx, cy, rotation, drawImg)
  } else {
    const { x, y } = calculateGridPosition(
      position.gridPosition, canvasW, canvasH, wmW, wmH, position.margin,
    )
    drawRotated(ctx, x + wmW / 2, y + wmH / 2, rotation, drawImg)
  }

  ctx.restore()
}

/**
 * 将文字渲染为带透明背景的 Canvas（用于嵌入 PDF）。
 * 返回包含旋转后文字的 canvas，以及实际水印尺寸。
 */
export function renderTextToCanvas(config: TextWatermarkConfig): HTMLCanvasElement {
  const { text, fontSize, color, bold, italic, rotation } = config

  // 先测量文字
  const tmp = document.createElement('canvas')
  const tmpCtx = tmp.getContext('2d')!
  tmpCtx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${fontSize}px Arial, "Microsoft YaHei", "PingFang SC", sans-serif`
  const metrics = tmpCtx.measureText(text)
  const wmW = metrics.width
  const wmH = fontSize * 1.3

  // 计算旋转后的边界框
  const rad = (rotation * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const boxW = Math.ceil(wmW * cos + wmH * sin) + 4
  const boxH = Math.ceil(wmW * sin + wmH * cos) + 4

  const canvas = document.createElement('canvas')
  canvas.width = boxW
  canvas.height = boxH
  const ctx = canvas.getContext('2d')!

  ctx.font = tmpCtx.font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.translate(boxW / 2, boxH / 2)
  ctx.rotate(rad)
  ctx.fillText(text, 0, 0)

  return canvas
}

/** 解析页码范围字符串，返回 0-based 页码数组 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const result: number[] = []
  const parts = rangeStr.split(',').map((s) => s.trim()).filter(Boolean)

  for (const part of parts) {
    if (part.includes('-')) {
      const [s, e] = part.split('-').map((n) => parseInt(n.trim(), 10))
      if (!isNaN(s) && !isNaN(e)) {
        for (let i = s; i <= e; i++) {
          if (i >= 1 && i <= totalPages) result.push(i - 1)
        }
      }
    } else {
      const num = parseInt(part, 10)
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        result.push(num - 1)
      }
    }
  }

  // 去重
  return [...new Set(result)]
}

/** 加载图片 dataURL 为 HTMLImageElement */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** 文件转 dataURL */
export function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
