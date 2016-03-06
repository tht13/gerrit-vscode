import * as events from "events";

export class Event {
    private static _event: events.EventEmitter = null;

    static get event() {
        if (Event._event === null) {
            Event._event = new events.EventEmitter();
        }
        return Event._event;
    }

}
