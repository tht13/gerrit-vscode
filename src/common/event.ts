import * as events from "events";
import { isNull } from "./utils";

class EventSingleton {
    private static _event: events.EventEmitter = null;

    static get event() {
        if (isNull(EventSingleton._event)) {
            EventSingleton._event = new events.EventEmitter();
        }
        return EventSingleton._event;
    }

}

const Event = EventSingleton.event;
export default Event;
