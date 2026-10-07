import { useState, useCallback } from 'react'
import { message } from 'antd'
import type { UploadedFile, FileType } from '../types'
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from '../types'
import { getPdfPageCount } from '../utils/pdfProcessor'

export function useFiles() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    let arr = Array.from(fileList)

    // PDF 一次只允许一个
    const pdfFiles = arr.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'),
    )
    if (pdfFiles.length > 1) {
      message.warning('PDF 一次只能选择一个文件，已自动选取第一个')
      arr = [pdfFiles[0], ...arr.filter((f) => !pdfFiles.includes(f))]
    }

    setLoading(true)
    const newFiles: UploadedFile[] = []

    for (const file of arr) {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      const isImage =
        ACCEPTED_IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name)

      if (!isPdf && !isImage) {
        message.error(`${file.name}：格式不支持，仅支持 PDF 和 JPG/PNG/WebP`)
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        message.error(`${file.name}：超过 200MB 限制，请压缩后再试`)
        continue
      }

      const fileType: FileType = isPdf ? 'pdf' : 'image'
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const url = isImage ? URL.createObjectURL(file) : ''

      let pageCount = 1
      if (isPdf) {
        try {
          pageCount = await getPdfPageCount(file)
        } catch {
          message.error(`${file.name}：PDF 加载失败`)
          continue
        }
      }

      newFiles.push({
        id,
        file,
        name: file.name,
        type: fileType,
        size: file.size,
        url,
        pageCount,
        currentPage: 0,
      })
    }

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles])
      setSelectedFileId(newFiles[0].id)
      message.success(`已添加 ${newFiles.length} 个文件`)
    }

    setLoading(false)
  }, [])

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const target = prev.find((f) => f.id === id)
        if (target?.url) URL.revokeObjectURL(target.url)
        const filtered = prev.filter((f) => f.id !== id)
        if (selectedFileId === id) {
          setSelectedFileId(filtered.length > 0 ? filtered[0].id : null)
        }
        return filtered
      })
    },
    [selectedFileId],
  )

  const clearFiles = useCallback(() => {
    files.forEach((f) => {
      if (f.url) URL.revokeObjectURL(f.url)
    })
    setFiles([])
    setSelectedFileId(null)
  }, [files])

  const updateFilePage = useCallback((id: string, currentPage: number) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, currentPage } : f)))
  }, [])

  const selectedFile = files.find((f) => f.id === selectedFileId) ?? null

  return {
    files,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    addFiles,
    removeFile,
    clearFiles,
    updateFilePage,
    loading,
  }
}
