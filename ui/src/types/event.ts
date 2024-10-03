export type Event = {
    readonly id?: string;
    type?: string;
    message?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
    readonly created?: Date;
    readonly updated?: Date
};
