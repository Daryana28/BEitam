// be\src\modules\cmms\workOrders\infra\eventBus.js
import { EventEmitter } from "events";

const eventBus = new EventEmitter();

// BUFFER FOR REALTIME STREAM
eventBus.setMaxListeners(1000);

export default eventBus;