export interface RejectReason {
    message: string;

    showInformation?: boolean;

    type: RejectType;

    attributes?: any;
}

export enum RejectType {
    DEFAULT,
    GIT,
    GET,
    NO_DIRTY
}
