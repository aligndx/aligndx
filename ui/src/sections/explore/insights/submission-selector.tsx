"use client";

import * as React from "react";
import { Combobox } from "@/components/ui/combobox"; // Adjust the import path as needed
import { useApiService } from "@/services/api";
import { Submission, Status } from "@/types/submission";

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
    return <div>Loading submissions...</div>;
  }

  return (
    <Combobox<Submission>
      items={completedSubmissions}
      value={value}
      onChange={onChange}
      multiple={multiple}
      disabled={disabled}
      limit={50}
      label="Source(s)"
      title="Select submission(s)"
      description="Select the submissions you want to analyze"
      searchPlaceholder="Search submissions..."
      itemToString={(item) => item.name}
    />
  );
}
