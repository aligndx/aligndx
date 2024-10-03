import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileCard } from "./file-card"

interface FileSelectionProps {
  files: File[]
  progresses?: Record<string, number>
  onRemove: (index: number) => void
}

function FileSelection({ files, progresses, onRemove }: FileSelectionProps) {
  return (
    <ScrollArea className="h-full w-full px-3">
      <div className="flex max-h-40 flex-col gap-4">
        {files.map((file, index) => (
          <FileCard
            key={index}
            file={file}
            onRemove={() => onRemove(index)}
            progress={progresses?.[file.name]}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

export default FileSelection
