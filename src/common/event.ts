import * as events from "events";
import { isNil } from "lodash";

class EventSingleton {
    private static _event: events.EventEmitter = null;

    static get event() {
        if (isNil(EventSingleton._event)) {
            EventSingleton._event = new events.EventEmitter();
        }
        return EventSingleton._event;
    }

}

const Event = EventSingleton.event;
export default Event;
