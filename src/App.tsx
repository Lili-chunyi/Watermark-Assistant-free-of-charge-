import React, { useState, useCallback } from 'react'
import { Layout, Tabs, Collapse, message, Typography, Tag, ConfigProvider } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import FileUploader from './components/FileUploader'
import FileList, { formatBytes } from './components/FileList'
import DownloadBar from './components/DownloadBar'
import Preview from './components/Preview'
import TextWatermarkConfig from './components/TextWatermarkConfig'
import ImageWatermarkConfig from './components/ImageWatermarkConfig'
import PositionConfig from './components/PositionConfig'
import PdfPageConfig from './components/PdfPageConfig'
import { useWatermark } from './hooks/useWatermark'
import { useFiles } from './hooks/useFiles'
import { processImageFile } from './utils/imageProcessor'
import { generateWatermarkedPdf } from './utils/pdfProcessor'
import JSZip from 'jszip'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

const App: React.FC = () => {
  const {
    watermarkConfig,
    setWatermarkConfig,
    exportConfig,
    setExportConfig,
    pageRangeConfig,
    setPageRangeConfig,
    updateTextConfig,
    updateImageConfig,
    updatePositionConfig,
    setWatermarkType,
    resetConfig,
  } = useWatermark()

  const {
    files,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    addFiles,
    removeFile,
    clearFiles,
    updateFilePage,
    loading: filesLoading,
  } = useFiles()

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)

  // 生成带水印文件名
  const getOutputName = (originalName: string, type: 'image' | 'pdf', exportFormat: string) => {
    const dotIndex = originalName.lastIndexOf('.')
    const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName
    const suffix = exportConfig.customSuffix || '_watermarked'
    if (type === 'image' && exportFormat !== 'original') {
      return `${baseName}${suffix}.${exportFormat}`
    }
    const ext = dotIndex > 0 ? originalName.slice(dotIndex) : ''
    return `${baseName}${suffix}${ext}`
  }

  // 下载单个文件
  const downloadFile = useCallback(
    async (id: string) => {
      const fileItem = files.find((f) => f.id === id)
      if (!fileItem) return

      setProcessingIds((prev) => new Set(prev).add(id))
      try {
        let blob: Blob
        let outputName: string

        if (fileItem.type === 'image') {
          blob = await processImageFile(fileItem.file, watermarkConfig, exportConfig.imageFormat)
          outputName = getOutputName(fileItem.name, 'image', exportConfig.imageFormat)
        } else {
          blob = await generateWatermarkedPdf(
            fileItem.file,
            watermarkConfig,
            pageRangeConfig,
            fileItem.currentPage,
          )
          outputName = getOutputName(fileItem.name, 'pdf', 'original')
        }

        // 触发下载
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = outputName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        message.success(`${outputName} 下载成功`)
      } catch (e) {
        console.error(e)
        message.error(`处理失败: ${(e as Error).message}`)
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [files, watermarkConfig, exportConfig, pageRangeConfig],
  )

  // 批量下载
  const downloadAll = useCallback(async () => {
    if (files.length === 0) return
    setBatchProgress({ current: 0, total: files.length })

    const results: { name: string; blob: Blob }[] = []

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i]
      setProcessingIds((prev) => new Set(prev).add(fileItem.id))
      try {
        let blob: Blob
        let outputName: string

        if (fileItem.type === 'image') {
          blob = await processImageFile(fileItem.file, watermarkConfig, exportConfig.imageFormat)
          outputName = getOutputName(fileItem.name, 'image', exportConfig.imageFormat)
        } else {
          blob = await generateWatermarkedPdf(
            fileItem.file,
            watermarkConfig,
            pageRangeConfig,
            fileItem.currentPage,
          )
          outputName = getOutputName(fileItem.name, 'pdf', 'original')
        }
        results.push({ name: outputName, blob })
      } catch (e) {
        console.error(e)
        message.error(`${fileItem.name} 处理失败: ${(e as Error).message}`)
      } finally {
        setProcessingIds((prev) => {
          const next = new Set(prev)
          next.delete(fileItem.id)
          return next
        })
        setBatchProgress({ current: i + 1, total: files.length })
      }
    }

    // 下载逻辑
    if (results.length === 0) {
      message.error('没有文件处理成功')
    } else if (results.length === 1) {
      const { name, blob } = results[0]
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } else {
      // 多文件打包 ZIP
      try {
        const zip = new JSZip()
        results.forEach(({ name, blob }) => {
          zip.file(name, blob)
        })
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'watermarked_files.zip'
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        message.success(`已打包下载 ${results.length} 个文件`)
      } catch (e) {
        console.error(e)
        message.error('打包下载失败，改为逐个下载')
        results.forEach(({ name, blob }) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = name
          a.click()
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        })
      }
    }

    setBatchProgress(null)
  }, [files, watermarkConfig, exportConfig, pageRangeConfig])

  // 重置
  const handleReset = useCallback(() => {
    resetConfig()
    message.success('所有参数已重置为默认值')
  }, [resetConfig])

  const isPdf = selectedFile?.type === 'pdf'

  // 折叠面板项
  const collapseItems = [
    {
      key: 'files',
      label: '文件列表',
      children: (
        <>
          <FileUploader onFiles={addFiles} loading={filesLoading} />
          <div style={{ marginTop: 12 }}>
            <FileList
              files={files}
              selectedFileId={selectedFileId}
              onSelect={setSelectedFileId}
              onRemove={removeFile}
              onDownload={downloadFile}
              processingIds={processingIds}
            />
          </div>
          {files.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              共 {files.length} 个文件，{formatBytes(files.reduce((sum, f) => sum + f.size, 0))}
            </div>
          )}
        </>
      ),
    },
    {
      key: 'watermark',
      label: '水印设置',
      children: (
        <>
          <Tabs
            defaultActiveKey={watermarkConfig.type}
            onChange={(key) => setWatermarkType(key as 'text' | 'image')}
            items={[
              {
                key: 'text',
                label: '文字水印',
                children: (
                  <TextWatermarkConfig
                    config={watermarkConfig.text}
                    onChange={updateTextConfig}
                  />
                ),
              },
              {
                key: 'image',
                label: '图片水印',
                children: (
                  <ImageWatermarkConfig
                    config={watermarkConfig.image}
                    onChange={updateImageConfig}
                  />
                ),
              },
            ]}
          />
          <PositionConfig
            config={watermarkConfig.position}
            onChange={updatePositionConfig}
            isPdf={isPdf}
          />
        </>
      ),
    },
    ...(isPdf
      ? [
          {
            key: 'pdf',
            label: 'PDF页面范围',
            children: (
              <PdfPageConfig
                config={pageRangeConfig}
                onChange={(updates) => setPageRangeConfig((prev) => ({ ...prev, ...updates }))}
                totalPages={selectedFile?.pageCount ?? 1}
                currentPage={(selectedFile?.currentPage ?? 0) + 1}
              />
            ),
          },
        ]
      : []),
    {
      key: 'download',
      label: '导出与下载',
      children: (
        <DownloadBar
          onDownloadAll={downloadAll}
          onReset={handleReset}
          fileCount={files.length}
          progress={batchProgress}
          exportConfig={exportConfig}
          onExportConfigChange={setExportConfig}
        />
      ),
    },
  ]

  return (
    <ConfigProvider locale={zhCN}>
      <Layout style={{ height: '100vh' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #1677ff 0%, #4096ff 100%)',
            padding: '0 24px',
            height: 56,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 26 }}>🍉</span>
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              水印助手-可批量加水印（永久免费）
            </Title>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag color="blue" icon={<LockOutlined />} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none' }}>
              本地处理 · 文件不上传
            </Tag>
          </div>
        </Header>

        <Layout style={{ height: 'calc(100vh - 56px)' }}>
          {/* 左侧控制面板 */}
          <Sider
            width={400}
            style={{
              background: '#fff',
              overflow: 'auto',
              borderRight: '1px solid #f0f0f0',
            }}
            className="control-panel"
          >
            <div style={{ padding: 16 }}>
              <Collapse
                defaultActiveKey={['files', 'watermark']}
                items={collapseItems}
                style={{ background: '#fff', border: 'none' }}
              />
            </div>
          </Sider>

          {/* 右侧预览区 */}
          <Content style={{ background: '#f0f2f5', padding: 16, overflow: 'hidden' }}>
            <Preview
              file={selectedFile}
              watermarkConfig={watermarkConfig}
              onPositionChange={(x, y) => updatePositionConfig({ customX: x, customY: y })}
              onPdfPageChange={(page) => selectedFile && updateFilePage(selectedFile.id, page)}
              onDownload={() => selectedFile && downloadFile(selectedFile.id)}
              downloadLoading={selectedFile ? processingIds.has(selectedFile.id) : false}
            />
          </Content>
        </Layout>
      </Layout>

      {/* 移动端响应式样式 */}
      <style>{`
        @media (max-width: 768px) {
          .ant-layout-sider {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            border-right: none !important;
            border-bottom: 1px solid #f0f0f0;
          }
          .ant-layout-content {
            height: 50vh;
          }
          .ant-layout-has-sider {
            flex-direction: column;
          }
        }
      `}</style>
    </ConfigProvider>
  )
}

export default App
