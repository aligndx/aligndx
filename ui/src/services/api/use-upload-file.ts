import * as React from "react";
import { toast } from "sonner";
import type { Data } from "@/types/data";
import PocketBase from 'pocketbase';

interface UseUploadFileProps {
    pb: PocketBase
    defaultUploadedFiles?: Data[];
}

interface AdditionalFormData {
    [key: string]: string | number | boolean;
}

interface FileWithOptionalId {
    id?: string;
    file: File;
}

export function useUploadFileHook(
    { pb, defaultUploadedFiles = [] }: UseUploadFileProps) {
    const [uploadedFiles, setUploadedFiles] = React.useState<Data[]>(defaultUploadedFiles);
    const [progresses, setProgresses] = React.useState<Record<string, number>>({});
    const [isUploading, setIsUploading] = React.useState(false);

    async function onUpload(files: FileWithOptionalId[], additionalData: AdditionalFormData = {}) {
        setIsUploading(true);
        const uploadResults: any[] = [];

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

                const progressKey = file.name;
                setProgresses((prev) => ({
                    ...prev,
                    [progressKey]: 0,
                }));

                // Wrap XMLHttpRequest in a Promise
                const uploadPromise = new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();

                    xhr.upload.onprogress = function (event) {
                        if (event.lengthComputable) {
                            const percentComplete = Math.round((event.loaded / event.total) * 100);
                            setProgresses((prev) => ({
                                ...prev,
                                [progressKey]: percentComplete,
                            }));
                        }
                    };

                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            const response = JSON.parse(xhr.responseText);
                            setUploadedFiles((prev) => [...prev, response]);
                            setProgresses((prev) => ({
                                ...prev,
                                [progressKey]: 100,
                            }));
                            uploadResults.push({ success: true, data: response, id });
                            resolve({ success: true, data: response });
                        } else {
                            const errorMessage = `Error uploading ${file.name}: ${xhr.statusText}`;
                            toast.error(errorMessage);
                            setProgresses((prev) => {
                                const { [progressKey]: _, ...rest } = prev;
                                return rest;
                            });
                            uploadResults.push({ success: false, error: xhr.statusText, id });
                            reject(new Error(errorMessage));
                        }
                    };

                    xhr.onerror = function () {
                        const errorMessage = `Error uploading ${file.name}: ${xhr.statusText}`;
                        toast.error(errorMessage);
                        setProgresses((prev) => {
                            const { [progressKey]: _, ...rest } = prev;
                            return rest;
                        });
                        uploadResults.push({ success: false, error: xhr.statusText, id });
                        reject(new Error(errorMessage));
                    };

                    xhr.open('POST', `${pb.baseUrl}/api/collections/data/records`);
                    xhr.setRequestHeader('Authorization', pb.authStore.token);
                    xhr.send(formData);
                });

                // Wait for the current file to be uploaded before proceeding to the next one
                await uploadPromise;
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
