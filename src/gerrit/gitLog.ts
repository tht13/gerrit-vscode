import * as utils from "../common/utils";

export interface GitLog {
    commit: string;
    author: Author;
    date: string;
    comment: string;
    change_id: string;
    review?: string;
    tested_by?: Author[];
    reviewed_by?: Author[];
}

export interface Author {
    name: string;
    email: string;
}

export function createLog(input: string): GitLog {
    let lines: string[] = input.split(utils.SPLIT_LINE);
    let commit = lines.shift().replace("commit ", "");
    let author_raw = lines.shift().replace("Author: ", "");
    let author_name = author_raw.substring(0, author_raw.indexOf("<") - 1);
    let author__email = author_raw.substring(author_raw.indexOf("<") + 1, author_raw.indexOf(">"));
    let date = lines.shift().replace("Date:", "").trim();
    let comment = "";
    let line = lines.shift();
    while (line.indexOf("Change-Id:") === -1) {
        if (comment.length > 0) {
            comment += "\n";
        }
        comment += line;
        line = lines.shift();
    }
    let change_id = line.replace("Change-Id:", "").trim();
    let gitLog: GitLog = {
        commit: commit,
        author: {
            name: author_name,
            email: author__email
        },
        date: date,
        comment: comment,
        change_id: change_id
    };
    return gitLog;
}
