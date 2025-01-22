"use client";

import * as React from "react";
import { Combobox } from "@/components/ui/combobox"; // Adjust the import path as needed
import { useApiService } from "@/services/api";
import { Submission, Status } from "@/types/submission";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useUpdateSearchParams } from "@/routes";

interface SubmissionSelectorProps {
  value?: Submission[];
  onChange?: (value: Submission[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}

export function SubmissionSelector({
  value = [], // Default to an empty array if no value is passed
  onChange,
  multiple = true,
  disabled = false,
}: SubmissionSelectorProps) {
  const { submissions } = useApiService();
  const { data, isLoading } = submissions.getSubmissionsQuery;
  const updateSearchParams = useUpdateSearchParams();

  // Parse submission IDs from the URL query string
  const searchParams = useSearchParams();
  const idsFromUrl = React.useMemo(() => {
    const ids = searchParams.getAll("id");
    return ids ? ids : [];
  }, [searchParams]);

  // Filter and only pass submissions that are completed
  const completedSubmissions = React.useMemo(
    () => data?.filter((submission) => submission.status === Status.Completed) || [],
    [data]
  );

  React.useEffect(() => {
    if (idsFromUrl.length > 0 && completedSubmissions.length > 0 && value.length === 0) {
      const initialSelected = completedSubmissions.filter((submission) =>
        idsFromUrl.includes(submission.id)
      );

      if (onChange) {
        onChange(initialSelected); // Set initial state from the URL
      }
    }
    // Only run on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsFromUrl, completedSubmissions]);

  // Handle selection change
  const handleChange = (selected: Submission[]) => {
    const ids = selected.map((submission) => submission.id);

    // Update the URL with the selected submission IDs
    updateSearchParams({ id: ids });

    // Call the onChange prop to update parent state
    if (onChange) {
      onChange(selected);
    }
  };

  // While loading, you might render a placeholder or spinner
  if (isLoading) {
    return <SubmissionSelectorSkeleton />;
  }

  return (
    <Combobox<Submission>
      items={completedSubmissions}
      value={value} // Controlled by the parent state
      onChange={handleChange}
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
  );
}
