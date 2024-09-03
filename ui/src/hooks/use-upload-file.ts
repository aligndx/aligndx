import * as React from "react";
import { toast } from "sonner";
import type { Data } from "@/types/data";
import { useApiService } from "@/services/api";

interface UseUploadFileProps {
    defaultUploadedFiles?: Data[];
}

interface AdditionalFormData {
    [key: string]: string | number | boolean;
}

interface FileWithOptionalId {
    id?: string;
    file: File;
}

export function useUploadFile(
    { defaultUploadedFiles = [] }: UseUploadFileProps = {}
) {
    const [uploadedFiles, setUploadedFiles] = React.useState<Data[]>(defaultUploadedFiles);
    const [progresses, setProgresses] = React.useState<Record<string, number>>({});
    const [isUploading, setIsUploading] = React.useState(false);
    const { data: { useCreateDataMutation } } = useApiService();
    const createDataMutation = useCreateDataMutation(); 
    
    async function onUpload(files: FileWithOptionalId[], additionalData: AdditionalFormData = {}) {
        setIsUploading(true);
        const uploadResults: any[] = []; // Local variable to accumulate uploaded files
        try {
            for (let index = 0; index < files.length; index++) {
                const { id, file } = files[index];
                const formData = new FormData();
                formData.append("name", file.name);
                formData.append("type", "file");
                formData.append("size", file.size.toString());
                formData.append("file", file);

                for (const [key, value] of Object.entries(additionalData)) {
                    formData.append(key, String(value));
                }
                const progressKey = id ?? file.name;
                setProgresses((prev) => ({
                    ...prev,
                    [progressKey]: 0,
                }));

                const data = await createDataMutation.mutateAsync(formData, {
                    onSuccess: (data) => {
                        uploadResults.push({ success: true, data, id: progressKey});
                        setUploadedFiles((prev) => (prev ? [...prev, data] : [data]));
                        setProgresses((prev) => ({
                            ...prev,
                            [progressKey]: 100,
                        }));
                    },
                    onError: (err) => {
                        toast.error(`Error uploading ${file.name}: ${err.message}`);
                        setProgresses((prev) => {
                            const { [progressKey]: _, ...rest } = prev;
                            return rest;
                        });
                        uploadResults.push({ success: false, error: err.message, id: progressKey }); 
                    },
                });
            }
        } catch (err) {
            toast.error(`Error: ${err}`);
        } finally {
            setIsUploading(false);
        }
        return uploadResults;
    }

    return {
        onUpload,
        uploadedFiles,
        progresses,
        isUploading,
    };
}
