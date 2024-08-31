import { Data } from "./data";
import { Workflow } from "./workflow";

export type Submission = {
    id: string;
    user: string;
    workflow: string | Workflow;
    name: string;
    inputs: any;
    data: string[]  | Data[];
    created: Date;
    updated: Date
};
