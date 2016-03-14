export interface IReview {
    "id": string;
    "project": string;
    "branch": string;
    "hashtags": string[];
    "change_id": string;
    "subject": string;
    "status": string;
    "created": string;
    "updated": string;
    "submittable": boolean;
    "insertions": number;
    "deletions": number;
    "_number": number;
    "owner": IUser;
    "labels": ILabel[];
    "permitted_labels": {};
    "removable_reviewers": string[];
    "current_revision": string;
    "revisions": IRevision[];
}

interface IUser {
    "_account_id": number;
    "name": string;
    "email": string;
    "username": string;
}

interface IVote extends IUser {
    "value": number;
    "date"?: string;
}

interface IRevision {
    "_number": string;
    "created": string;
    "uploader": IUser;
    "ref": string;
    "fetch": {
        "ssh": {
            "url": string;
            "ref": string;
        };
        "http": {
            "url": string;
            "ref": string
        };
    };
}

interface ILabel {
    "all": IVote[];
    "values": any;
    "default_value": number;
}
