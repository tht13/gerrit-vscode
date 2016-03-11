import * as events from "events";

class EventSingleton {
    private static _event: events.EventEmitter = null;

    static get event() {
        if (EventSingleton._event === null) {
            EventSingleton._event = new events.EventEmitter();
        }
        return EventSingleton._event;
    }

}

const Event = EventSingleton.event;
export default Event;
