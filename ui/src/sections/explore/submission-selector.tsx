"use client";

import * as React from "react";
import { Combobox } from "@/components/ui/combobox"; // Adjust the import path as needed
import { useApiService } from "@/services/api";
import { Submission, Status } from "@/types/submission";
import { Skeleton } from "@/components/ui/skeleton";

interface SubmissionSelectorProps {
  value?: Submission[];
  onChange?: (value: Submission[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export function SubmissionSelector({
  value,
  onChange,
  multiple = true,
  disabled = false,
}: SubmissionSelectorProps) {
  const { submissions } = useApiService();
  const { data, isLoading } = submissions.getSubmissionsQuery;

  // Filter and only pass submissions that are completed
  const completedSubmissions = React.useMemo(
    () => data?.filter((submission) => submission.status === Status.Completed) || [],
    [data]
  );

  // While loading, you might render a placeholder or spinner
  if (isLoading) {
    return <SubmissionSelectorSkeleton />
  }

  return (
    <Combobox<Submission>
      items={completedSubmissions}
      value={value}
      onChange={onChange}
      multiple={multiple}
      disabled={disabled}
      label="Source(s)"
      title="Submission(s)"
      description="Select the submissions you want to analyze"
      searchPlaceholder="Search submissions..."
      itemToString={(item) => item.name}
    />
  );
}

function SubmissionSelectorSkeleton() {
  return (
      <div className="flex flex-col space-y-3">
          <div className="space-y-2">
              <Skeleton className="h-4 w-[70px] rounded-xl" />
              <Skeleton className="h-4 w-[250px]" />
          </div>
          <div className="flex gap-1">
              <Skeleton className="h-10 w-[200px]" />
          </div>
      </div>

  )
}