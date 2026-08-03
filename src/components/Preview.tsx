import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button, Space, Empty, Spin, message } from 'antd'
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  FileImageOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import type { UploadedFile, WatermarkConfig } from '../types'
import { drawWatermarkOnCanvas } from '../utils/imageProcessor'
import { loadPdfForPreview, renderPdfPage, PDF_RENDER_SCALE } from '../utils/pdfProcessor'
import { loadImage } from '../utils/watermark'

export interface PreviewProps {
  file: UploadedFile | null
  watermarkConfig: WatermarkConfig
  onPositionChange: (xPercent: number, yPercent: number) => void
  onPdfPageChange?: (page: number) => void
  onDownload?: () => void
  downloadLoading?: boolean
}

const Preview: React.FC<PreviewProps> = ({
  file,
  watermarkConfig,
  onPositionChange,
  onPdfPageChange,
  onDownload,
  downloadLoading = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<any>(null)
  const imageElRef = useRef<HTMLImageElement | null>(null)

  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  // 渲染图片预览
  const renderImagePreview = useCallback(async () => {
    if (!file || !canvasRef.current) return
    setLoading(true)
    setError(null)
    try {
      // 加载图片（缓存）
      if (!imageElRef.current || imageElRef.current.src !== file.url) {
        imageElRef.current = await loadImage(file.url)
      }
      const img = imageElRef.current
      const canvas = canvasRef.current
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      // 绘制水印
      await drawWatermarkOnCanvas(canvas, watermarkConfig)
    } catch (e) {
      console.error(e)
      setError('图片加载失败')
    } finally {
      setLoading(false)
    }
  }, [file, watermarkConfig])

  // 渲染 PDF 预览
  const renderPdfPreview = useCallback(async () => {
    if (!file || !canvasRef.current) return
    setLoading(true)
    setError(null)
    try {
      // 加载 PDF（缓存）
      if (!pdfDocRef.current) {
        pdfDocRef.current = await loadPdfForPreview(file.file)
      }
      const pdf = pdfDocRef.current
      const pageIndex = file.currentPage // 0-based
      const renderScale = PDF_RENDER_SCALE
      // 渲染 PDF 页面到 canvas
      const pageCanvas = await renderPdfPage(pdf, pageIndex + 1, renderScale)
      const canvas = canvasRef.current
      canvas.width = pageCanvas.width
      canvas.height = pageCanvas.height
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(pageCanvas, 0, 0)
      // 叠加水印
      await drawWatermarkOnCanvas(canvas, watermarkConfig)
    } catch (e) {
      console.error(e)
      setError('PDF 加载失败')
    } finally {
      setLoading(false)
    }
  }, [file, watermarkConfig])

  // 根据文件类型渲染
  useEffect(() => {
    if (!file) return
    if (file.type === 'image') {
      renderImagePreview()
    } else {
      renderPdfPreview()
    }
  }, [renderImagePreview, renderPdfPreview, file])

  // 文件切换时重置缓存
  useEffect(() => {
    imageElRef.current = null
    pdfDocRef.current = null
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy()
        pdfDocRef.current = null
      }
    }
  }, [file?.id])

  // 拖拽水印
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!file || file.type === 'pdf') return
    if (watermarkConfig.position.mode !== 'custom') return
    setDragging(true)
    handleDrag(e)
  }

  const handleDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging && e.type !== 'mousedown') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // 考虑 canvas 实际显示尺寸与原始尺寸的比例
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const xPercent = Math.max(0, Math.min(100, (x / canvas.width) * 100))
    const yPercent = Math.max(0, Math.min(100, (y / canvas.height) * 100))
    onPositionChange(xPercent, yPercent)
  }

  const handleMouseUp = () => setDragging(false)

  // 翻页
  const goToPage = (delta: number) => {
    if (!file || file.type !== 'pdf' || !onPdfPageChange) return
    const newPage = Math.max(0, Math.min(file.pageCount - 1, file.currentPage + delta))
    onPdfPageChange(newPage)
  }

  // 缩放
  const changeZoom = (delta: number) => {
    setZoom((prev) => Math.max(50, Math.min(300, prev + delta)))
  }

  // 空状态：预览区域内容
  const emptyPreview = !file

  const isPdf = file?.type === 'pdf'
  const canDrag =
    !emptyPreview && !isPdf && watermarkConfig.position.mode === 'custom'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {/* 顶部工具栏（仅在有文件时显示） */}
      {!emptyPreview && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            background: '#fafafa',
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          <Space>
            <Button
              size="small"
              icon={<ZoomOutOutlined />}
              onClick={() => changeZoom(-10)}
              disabled={zoom <= 50}
            />
            <span style={{ fontSize: 12, minWidth: 48, textAlign: 'center' }}>{zoom}%</span>
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              onClick={() => changeZoom(10)}
              disabled={zoom >= 300}
            />
          </Space>

          {isPdf && (
            <Space>
              <Button
                size="small"
                icon={<LeftOutlined />}
                onClick={() => goToPage(-1)}
                disabled={file!.currentPage <= 0}
              >
                上一页
              </Button>
              <span style={{ fontSize: 12 }}>
                第 {file!.currentPage + 1} / {file!.pageCount} 页
              </span>
              <Button
                size="small"
                onClick={() => goToPage(1)}
                disabled={file!.currentPage >= file!.pageCount - 1}
              >
                下一页
                <RightOutlined />
              </Button>
            </Space>
          )}
        </div>
      )}

      {/* 预览区域 */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: 8,
          padding: 16,
          position: 'relative',
        }}
      >
        {emptyPreview ? (
          <Empty
            image={<FileImageOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description="请上传文件后预览"
          />
        ) : (
          <>
            {loading && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <Spin tip="加载中..." size="large" />
              </div>
            )}
            {error && (
              <div style={{ color: '#ff4d4f', textAlign: 'center' }}>
                <p>{error}</p>
                <Button size="small" onClick={() => (isPdf ? renderPdfPreview() : renderImagePreview())}>
                  重试
                </Button>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleDrag}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: `${zoom}%`,
                objectFit: 'contain',
                cursor: canDrag ? (dragging ? 'grabbing' : 'grab') : 'default',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                background: '#fff',
                display: loading || error ? 'none' : 'block',
              }}
            />
          </>
        )}
      </div>

      {/* 底部保存下载按钮 */}
      <Button
        type="primary"
        size="large"
        icon={<DownloadOutlined />}
        onClick={() => onDownload?.()}
        loading={downloadLoading}
        disabled={!file}
        block
        style={{
          height: 52,
          fontSize: 17,
          fontWeight: 600,
          borderRadius: 8,
          flexShrink: 0,
        }}
      >
        保存下载
      </Button>
    </div>
  )
}

export default Preview
