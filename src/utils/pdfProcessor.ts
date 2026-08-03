import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocument } from 'pdf-lib'
import { renderTextToCanvas, calculateGridPosition, parsePageRange, loadImage } from './watermark'
import type {
  WatermarkConfig,
  PageRangeConfig,
  TextWatermarkConfig,
  ImageWatermarkConfig,
  PositionConfig,
} from '../types'

// ===== pdf.js worker 初始化 =====

// PDF 预览渲染缩放比：pdf.js 将 PDF 页面放大此倍数渲染到 canvas。
// 预览时水印的像素值（fontSize/margin 等）画在放大后的 canvas 上，
// 导出时 pdf-lib 使用 PDF 原始点坐标系，需要把像素值除以此比例换算为 PDF 点，
// 以保证导出效果与预览一致。
export const PDF_RENDER_SCALE = 1.5

let pdfJsReady = false
function ensurePdfJsWorker() {
  if (pdfJsReady) return
  // 使用 Vite 的 ?worker 导入，确保 worker 被正确打包
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href
  pdfJsReady = true
}

/** 加载 PDF 用于预览（返回 pdf.js document proxy） */
export async function loadPdfForPreview(file: File): Promise<any> {
  ensurePdfJsWorker()
  const arrayBuffer = await file.arrayBuffer()
  // 注意：arrayBuffer 会被 pdf.js 转移所有权，需要 copy 一份
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
  return pdf
}

/** 获取 PDF 页数 */
export async function getPdfPageCount(file: File): Promise<number> {
  const pdf = await loadPdfForPreview(file)
  const count = pdf.numPages
  pdf.destroy()
  return count
}

/** 渲染 PDF 指定页面到 Canvas（用于预览） */
export async function renderPdfPage(
  pdf: any,
  pageNum: number,
  scale = PDF_RENDER_SCALE,
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas
}

// ===== 生成带水印的 PDF =====

/**
 * 生成带水印的 PDF Blob
 * 文字水印：先将文字渲染为 Canvas（支持中文），再作为 PNG 嵌入 PDF
 * 图片水印：直接嵌入
 */
export async function generateWatermarkedPdf(
  file: File,
  watermarkConfig: WatermarkConfig,
  pageRangeConfig: PageRangeConfig,
  currentPage: number,
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer()
  const { PDFDocument } = await import('pdf-lib')
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const pages = pdfDoc.getPages()
  const totalPages = pages.length

  // 确定目标页面（0-based）
  let targetPages: number[]
  if (pageRangeConfig.mode === 'all') {
    targetPages = pages.map((_, i) => i)
  } else if (pageRangeConfig.mode === 'current') {
    targetPages = [currentPage]
  } else {
    targetPages = parsePageRange(pageRangeConfig.customRange, totalPages)
  }

  if (targetPages.length === 0) {
    throw new Error('没有匹配的页面，请检查页码范围设置')
  }

  // 预览时 pdf.js 用 PDF_RENDER_SCALE 放大页面渲染到 canvas，
  // 水印的像素值（fontSize/margin/图片尺寸）画在放大后的 canvas 上。
  // 导出时 pdf-lib 使用 PDF 原始点坐标系，需要把像素值除以此比例换算为 PDF 点，
  // 以保证导出效果与预览一致。
  const s = PDF_RENDER_SCALE
  const scaledTextConfig: TextWatermarkConfig = {
    ...watermarkConfig.text,
    fontSize: watermarkConfig.text.fontSize / s,
  }
  const scaledPosition: PositionConfig = {
    ...watermarkConfig.position,
    margin: watermarkConfig.position.margin / s,
  }
  const scaledImageConfig: ImageWatermarkConfig = {
    ...watermarkConfig.image,
    scale: watermarkConfig.image.scale / s,
  }

  if (watermarkConfig.type === 'text') {
    await addTextWatermarkToPages(pdfDoc, pages, targetPages, scaledTextConfig, scaledPosition)
  } else {
    if (watermarkConfig.image.imageData) {
      await addImageWatermarkToPages(pdfDoc, pages, targetPages, scaledImageConfig, scaledPosition)
    }
  }

  const pdfBytes = await pdfDoc.save()
  // 使用 copy 避免类型问题
  return new Blob([pdfBytes.slice()], { type: 'application/pdf' })
}

async function addTextWatermarkToPages(
  pdfDoc: PDFDocument,
  pages: ReturnType<PDFDocument['getPages']>,
  targetPages: number[],
  config: TextWatermarkConfig,
  position: PositionConfig,
) {
  if (!config.text) return

  // 将文字渲染为带透明背景的 Canvas（包含旋转包围盒）
  const textCanvas = renderTextToCanvas(config)
  const pngDataUrl = textCanvas.toDataURL('image/png')
  const pngImage = await pdfDoc.embedPng(pngDataUrl)

  // imgW/imgH：图片实际尺寸（旋转包围盒，用于绘制）
  const imgW = textCanvas.width
  const imgH = textCanvas.height

  // 计算文字本身的尺寸（与预览 drawTextWatermark 保持一致，用于平铺间距计算）
  const tmpCanvas = document.createElement('canvas')
  const tmpCtx = tmpCanvas.getContext('2d')!
  tmpCtx.font = `${config.italic ? 'italic ' : ''}${config.bold ? 'bold ' : ''}${config.fontSize}px Arial, "Microsoft YaHei", "PingFang SC", sans-serif`
  const textW = tmpCtx.measureText(config.text).width
  const textH = config.fontSize

  for (const pageIndex of targetPages) {
    const page = pages[pageIndex]
    const { width: pageW, height: pageH } = page.getSize()

    if (position.mode === 'tile') {
      // 平铺间距用文字尺寸（匹配预览），绘制用图片尺寸
      drawTiledOnPdfPage(page, pngImage, imgW, imgH, textW, textH, pageW, pageH, position, config.opacity)
    } else {
      const pos =
        position.mode === 'custom'
          ? {
              x: (position.customX / 100) * pageW - imgW / 2,
              y: (position.customY / 100) * pageH - imgH / 2,
            }
          : calculateGridPosition(position.gridPosition, pageW, pageH, imgW, imgH, position.margin)

      // Canvas 坐标 (左上角原点, Y向下) → pdf-lib 坐标 (左下角原点, Y向上)
      page.drawImage(pngImage, {
        x: pos.x,
        y: pageH - pos.y - imgH,
        width: imgW,
        height: imgH,
        opacity: config.opacity / 100,
      })
    }
  }
}

function drawTiledOnPdfPage(
  page: ReturnType<PDFDocument['getPages']>[number],
  image: Awaited<ReturnType<PDFDocument['embedPng']>>,
  imgW: number,
  imgH: number,
  stepW: number,
  stepH: number,
  pageW: number,
  pageH: number,
  position: PositionConfig,
  opacity: number,
) {
  // stepW/stepH 决定平铺间距（与预览一致），imgW/imgH 是图片实际绘制尺寸
  const stepX = stepW + position.margin * 2
  const stepY = stepH + position.margin * 2
  const extra = Math.max(stepW, stepH)

  // 居中偏移：让图片中心对齐平铺单元中心
  const offsetX = (stepW - imgW) / 2
  const offsetY = (stepH - imgH) / 2

  for (let y = -extra; y < pageH + extra; y += stepY) {
    for (let x = -extra; x < pageW + extra; x += stepX) {
      page.drawImage(image, {
        x: x + offsetX,
        y: pageH - (y + offsetY) - imgH,
        width: imgW,
        height: imgH,
        opacity: opacity / 100,
      })
    }
  }
}

async function addImageWatermarkToPages(
  pdfDoc: PDFDocument,
  pages: ReturnType<PDFDocument['getPages']>,
  targetPages: number[],
  config: ImageWatermarkConfig,
  position: PositionConfig,
) {
  const dataUrl = config.imageData!
  let image: Awaited<ReturnType<PDFDocument['embedPng']>>

  if (dataUrl.startsWith('data:image/svg')) {
    // SVG 先转为 PNG
    const img = await loadImage(dataUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    image = await pdfDoc.embedPng(canvas.toDataURL('image/png'))
  } else if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    image = await pdfDoc.embedJpg(dataUrl)
  } else {
    image = await pdfDoc.embedPng(dataUrl)
  }

  const imgW = image.width * (config.scale / 100)
  const imgH = image.height * (config.scale / 100)

  for (const pageIndex of targetPages) {
    const page = pages[pageIndex]
    const { width: pageW, height: pageH } = page.getSize()

    if (position.mode === 'tile') {
      // 图片水印：步距与绘制尺寸相同
      drawTiledOnPdfPage(page, image, imgW, imgH, imgW, imgH, pageW, pageH, position, config.opacity)
    } else {
      const pos =
        position.mode === 'custom'
          ? {
              x: (position.customX / 100) * pageW - imgW / 2,
              y: (position.customY / 100) * pageH - imgH / 2,
            }
          : calculateGridPosition(position.gridPosition, pageW, pageH, imgW, imgH, position.margin)

      page.drawImage(image, {
        x: pos.x,
        y: pageH - pos.y - imgH,
        width: imgW,
        height: imgH,
        opacity: config.opacity / 100,
      })
    }
  }
}
