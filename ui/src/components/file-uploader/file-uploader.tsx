"use client"

import * as React from "react"
import { Trash, Upload as UploadIcon } from "@/components/icons"
import Dropzone, {
  type DropzoneProps,
  type FileRejection,
} from "react-dropzone"
import { toast } from "sonner"

import { cn, formatBytes } from "@/lib/utils"
import { isFileWithPreview } from "./file-card"
import { useControllableState } from "@/hooks/use-controllable-state"
import FileSelection from "./file-selection"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"

export interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: File[]
  onValueChange?: (files: File[]) => void
  onUpload?: (files: File[]) => Promise<void>
  progresses?: Record<string, number>
  accept?: DropzoneProps["accept"]
  maxSize?: DropzoneProps["maxSize"]
  totalMaxSize?: number
  maxFileCount?: DropzoneProps["maxFiles"]
  multiple?: boolean
  disabled?: boolean
  compact?: boolean
}

export default function FileUploader(props: FileUploaderProps) {
  const {
    value: valueProp,
    onValueChange,
    onUpload,
    progresses,
    accept = {
      "image/*": [],
    },
    maxSize = null,
    maxFileCount = null,
    totalMaxSize = null,
    multiple = false,
    disabled = false,
    compact = false,
    className,
    ...dropzoneProps
  } = props

  const [files, setFiles] = useControllableState({
    prop: valueProp,
    onChange: onValueChange,
  })

  const uploadMessage = getUploadMessage({ maxFileCount, maxSize, totalMaxSize });

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        toast.error("Cannot upload more than 1 file at a time")
        return
      }

      if (maxFileCount !== null && (files?.length ?? 0) + acceptedFiles.length > maxFileCount) {
        toast.error(`Cannot upload more than ${maxFileCount} files`)
        return
      }

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )

      const updatedFiles = files ? [...files, ...newFiles] : newFiles

      const totalSize = updatedFiles.reduce((acc, file) => acc + file.size, 0)
      if (totalMaxSize !== null && totalSize > totalMaxSize) {
        toast.error(`Total file size exceeds the limit of ${formatBytes(totalMaxSize)}`)
        return
      }

      setFiles(updatedFiles)

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file }) => {
          toast.error(`File ${file.name} was rejected`)
        })
      }

      if (
        onUpload &&
        updatedFiles.length > 0 &&
        (maxFileCount === null || updatedFiles.length <= maxFileCount)
      ) {
        const target =
          updatedFiles.length > 0 ? `${updatedFiles.length} files` : `file`

        toast.promise(onUpload(updatedFiles), {
          loading: `Uploading ${target}...`,
          success: () => {
            setFiles([])
            return `${target} uploaded`
          },
          error: `Failed to upload ${target}`,
        })
      }
    },

    [files, maxFileCount, multiple, onUpload, setFiles, totalMaxSize]
  )

  function onRemove(index: number) {
    if (!files) return
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onValueChange?.(newFiles)
  }

  // Revoke preview url when component unmounts
  React.useEffect(() => {
    return () => {
      if (!files) return
      files.forEach((file) => {
        if (isFileWithPreview(file)) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isDisabled = disabled || (maxFileCount !== null && (files?.length ?? 0) >= maxFileCount)

  return (
    <div className={cn(compact ? "flex" : "relative flex flex-col gap-2 overflow-hidden")}>
      <div className={cn("flex", compact && "flex-1")}>
        <Dropzone
          onDrop={onDrop}
          accept={accept}
          maxSize={maxSize !== null ? maxSize : undefined}
          maxFiles={maxFileCount !== null ? maxFileCount : undefined}
          multiple={maxFileCount === null || maxFileCount > 1 || multiple}
          disabled={isDisabled}
        >
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={cn(
                "group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-5 py-2.5 text-center transition hover:bg-muted/25",
                files?.length && "border-r-0 rounded-tr-none rounded-br-none",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isDragActive && "border-muted-foreground/50",
                isDisabled && "pointer-events-none opacity-60",
                className
              )}
              {...dropzoneProps}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                  <div className="rounded-full border border-dashed p-3">
                    <UploadIcon
                      className="size-7 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="font-medium text-muted-foreground">
                    Drop the files here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
                  <div className="rounded-full border border-dashed p-3">
                    <UploadIcon
                      className="size-7 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex flex-col gap-px">
                    <p className="font-medium text-muted-foreground">
                      Drag {`'n'`} drop files here, or click to select files
                    </p>
                    {uploadMessage && (
                      <p className="text-sm text-muted-foreground/70">
                        {uploadMessage}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Dropzone>
      </div>
      {files && files?.length > 0 && (
        <div className={cn("", compact ? "flex-1 text-xs flex flex-col gap-4 h-52 overflow-hidden rounded-tr-lg rounded-br-lg border border-muted-foreground/25" : null)}>
          <header className="flex items-center justify-between border-b sticky gap-2 px-2">
            <p className="flex-1 text-start text-xs font-thin text-muted-foreground">
              {files.reduce((acc) => acc + 1, 0)} files
            </p>
            <Separator orientation="vertical" />
            <p className="flex-1 text-start text-xs font-thin text-muted-foreground">
              Total : {formatBytes(files.reduce((acc, file) => acc + file.size, 0))}
            </p>
            <Separator orientation="vertical" />
            <Button className={"px-2"} variant={"icon"} onClick={() => setFiles([])}><Trash className="h-4 w-4" /></Button>
          </header>
          <div className={cn("", compact ? null : "pt-2")}>
            <FileSelection
              files={files}
              progresses={progresses}
              onRemove={onRemove}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function getUploadMessage({
  maxFileCount,
  maxSize,
  totalMaxSize,
}: {
  maxFileCount: number | null;
  maxSize: number | null;
  totalMaxSize: number | null;
}): string | null {
  switch (true) {
    case maxFileCount !== null && maxSize !== null && totalMaxSize !== null:
      return `You can upload up to ${maxFileCount} files (up to ${formatBytes(maxSize)} each), total size limit: ${formatBytes(totalMaxSize)}.`;

    case maxFileCount !== null && maxSize !== null:
      return `You can upload up to ${maxFileCount} files (up to ${formatBytes(maxSize)} each).`;

    case maxFileCount !== null && totalMaxSize !== null:
      return `You can upload up to ${maxFileCount} files, total size limit: ${formatBytes(totalMaxSize)}.`;

    case maxSize !== null && totalMaxSize !== null:
      return `You can upload files (up to ${formatBytes(maxSize)} each), total size limit: ${formatBytes(totalMaxSize)}.`;

    case maxFileCount !== null:
      return `You can upload up to ${maxFileCount} files.`;

    case maxSize !== null:
      return `You can upload a file with up to ${formatBytes(maxSize)}.`;

    case totalMaxSize !== null:
      return `You can upload files up to a total size limit of ${formatBytes(totalMaxSize)}.`;

    default:
      return null;
  }
}



