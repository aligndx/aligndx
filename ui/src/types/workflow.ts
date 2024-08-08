export type SchemaStep = {
    name: string;
    action?: string;
    run?: string;
    with?: Record<string, any>;
};

export type Schema = {
    version: string;
    steps: SchemaStep[];
};

export type Workflow = {
    id: string;
    name: string;
    repository: string;
    description: string;
    schema: any;
};
