export interface GerritSettings {
    host: string;

    protocol: string;

    httpPort: number;

    sshPort: number;

    username: string;

    // TODO: Get this automatically?
    project: string;

    version: string;
}
