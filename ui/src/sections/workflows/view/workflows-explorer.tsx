'use client'

import { WorkflowExplorer } from "../explorer";
import { useSearchParams } from "@/routes";

export default function WorkflowExplorerView() {
    const searchParams = useSearchParams()
    const search = searchParams.get('id')

    return (
        <div>
            {search ?
                <div>
                    <header className="px-6 py-2 border-b sticky">
                        {search}
                    </header>
                    test
                </div>
                :
                <WorkflowExplorer />
            }
        </div>

    )
}