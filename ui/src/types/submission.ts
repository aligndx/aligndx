import { Data } from "./data";
import { Event } from "./event";
import { Workflow } from "./workflow";

export enum Status {
    Created = "created",
    Queued = "queued",
    Processing = "processing",
    Finished = "finished",
    Error = "error"
}

export type Submission = {
    id: string;
    user: string;
    workflow: string | Workflow;
    name: string;
    inputs: any;
    status?: Status;
    events?: Event;
    outputs: string[] | Data[];
    created: Date;
    updated: Date
};
