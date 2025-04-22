export abstract class BaseClass {
    readonly id: string;
    private events = new Map();

    /**
     * Constructs a new instance of the class
     */
    constructor(props: { id: string }) {
        this.id = props.id || this.constructor.name.toLowerCase();
    }

    /**
     * Retuns the JSON representation of the instance
     * @returns {Object}
     */
    toJSON(): object {
        return { id: this.id };
    }

    /**
     * Returns the current state of the instance
     * @type {Object}
     */
    [Symbol.for('nodejs.util.inspect.custom')](): object {
        return this.toJSON();
    }

    /**
     * Bubbles up events from the emitter to the native chain
     * @param {BaseClass} emitter The emitter to bubble events from
     * @returns {BaseClass}
     */
    protected bubbleLogs<T extends BaseClass>(emitter: T): T {
        return emitter.on('log', (level: string, event: string, ...args: any[]) => {
            switch (level) {
                case 'debug':
                    this.debug(event, ...args);
                    break;

                case 'info':
                    this.info(event, ...args);
                    break;

                case 'warn':
                    this.warn(event, ...args);
                    break;

                case 'error':
                    this.error(event, ...args);
                    break;

                default:
                    this.warn('Unknown log level', level, ...args);
            }
        });
    }

    //////////////////////////////////////////////////////////////////////////////
    // EventEmitter
    //////////////////////////////////////////////////////////////////////////////

    /**
     * Emits an event
     * @param {String} eventName The name of the event
     * @param {*} args Arguments supplied to the event listener(s)
     * @returns {Boolean} true, if the event was handled; otherwise false
     */
    emit(eventName: string, ...args: any[]) {
        const { events } = this;
        if (!events.has(eventName)) return false;

        const listeners = events.get(eventName);
        const result = listeners.size !== 0;

        for (const listener of listeners) {
            listener.call(this, ...args);
        }

        return result;
    }

    /**
     * Executes the listener whenever the event fires
     * @param {String} eventName The name of the event
     * @param {Function} listener The function to execute when the event fires
     * @returns {BaseClass}
     */
    on(eventName: string, listener: (...args: any[]) => void) {
        const { events } = this;

        if (!events.has(eventName)) {
            events.set(eventName, new Set());
        }
        this.emit('newListener', eventName, listener);

        const listeners = events.get(eventName);
        listeners.add(listener);

        return this;
    }

    /**
     * Executes the listener exactly once when the event fires
     * @param {String} eventName The name of the event
     * @param {Function} listener The function to execute when the event fires
     * @returns {BaseClass}
     */
    once(eventName: string, listener: (...args: any[]) => void) {
        const { events } = this;

        if (!events.has(eventName)) {
            events.set(eventName, new Set());
        }
        this.emit('newListener', eventName, listener);

        const listeners = events.get(eventName);
        const wrapper = function (...args: any[]) {
            listeners.delete(wrapper);
            if (listeners.size === 0) events.delete(eventName);
            listener(...args);
        };
        listeners.add(wrapper);

        return this;
    }

    /**
     * Removes the listener from the list of listeners for the event
     * @param {String} eventName The name of the event
     * @param {Function} listener The function to remove
     * @returns {BaseClass}
     */
    off(eventName: string, listener: (...args: any[]) => void) {
        const { events } = this;

        if (events.has(eventName)) {
            const listeners = events.get(eventName);
            listeners.delete(listener);
            if (listeners.size === 0) events.delete(eventName);
            this.emit('removeListener', eventName, listener);
        }

        return this;
    }

    /**
     * Executes the listener whenever the event fires; alias of on()
     * @param {String} eventName The name of the event
     * @param {Function} listener The function to execute when the event fires
     * @returns {BaseClass}
     */
    addListener(eventName: any, listener: any) {
        return this.on(eventName, listener);
    }

    /**
     * Removes all listeners
     * @param {String} [eventName] The name of the event
     * @returns {BaseClass}
     */
    removeAllListeners(eventName?: any) {
        const { events } = this;

        // If no event name is provided, remove all listeners
        if (eventName === undefined) {
            for (const eventName of events.keys()) {
                this.removeAllListeners(eventName);
            }
            return this;
        }

        // Remove all listeners for the event name
        if (events.has(eventName)) {
            const listeners = events.get(eventName);
            events.delete(eventName);

            for (const listener of listeners) {
                this.emit('removeListener', eventName, listener);
            }
        }

        return this;
    }

    /**
     * Removes a listener for the event; alias of off()
     * @param {String} eventName The name of the event
     * @param {Function} listener The function to remove
     * @returns {BaseClass}
     */
    removeListener(eventName: string, listener: (...args: any[]) => void) {
        return this.off(eventName, listener);
    }

    /**
     * Returns an array listing the events that have listeners
     * @returns {Array<String>}
     */
    eventNames() {
        const { events } = this;
        return Array.from(events.keys());
    }

    /**
     * Returns an array of listeners for the specified event
     *
     * This is subtly different from `EventEmitter` in that it returns listeners
     * wrapped by the `.once()` method.
     * @returns {Array<Function>}
     */
    listeners(eventName: any) {
        const { events } = this;
        return events.has(eventName) ? Array.from(events.get(eventName)) : [];
    }

    //////////////////////////////////////////////////////////////////////////////
    // Logging
    //////////////////////////////////////////////////////////////////////////////

    /**
     * Logs the provided arguments at the debug level
     * @param {String} event The name of the event
     * @param {*} args Arguments describing the context of the event
     * @returns {undefined}
     */
    debug(event: any, ...args: any[]) {
        this.emit('log', 'debug', `${this.id}.${event}`, ...args);
    }

    /**
     * Logs the provided arguments at the info level
     * @param {String} event The name of the event
     * @param {*} args Arguments describing the context of the event
     * @returns {undefined}
     */
    info(event: any, ...args: any[]) {
        this.emit('log', 'info', `${this.id}.${event}`, ...args);
    }

    /**
     * Logs the provided arguments at the warn level
     * @param {String} event The name of the event
     * @param {*} args Arguments describing the context of the event
     * @returns {undefined}
     */
    warn(event: any, ...args: any[]) {
        this.emit('log', 'warn', `${this.id}.${event}`, ...args);
    }

    /**
     * Logs the provided arguments at the error level
     * @param {String} event The name of the event
     * @param {*} args Arguments describing the context of the event
     * @returns {undefined}
     */
    error(event: any, ...args: any[]) {
        this.emit('log', 'error', `${this.id}.${event}`, ...args);
    }
}

export interface SdkProps {
    id: string;
    db: string;
}

export class MockPortalSdk extends BaseClass {
    #started = false;

    constructor(props: SdkProps) {
        super(props);
    }

    get isStarted(): boolean {
        return this.#started;
    }
    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    get portalAddress(): string {
        return '';
    }

    nativeAddress(chain: string): string | null {
        return chain;
    }

    async start() {
        if (this.#started) throw Error('SDK was already started!');
        this.#started = true;
        this.info('start');
        return this;
    }

    async stop() {
        if (!this.#started) throw Error('SDK was not started!');

        this.#started = false;
        this.info('stop');
        return this;
    }

    async nativeBalance(_chain: string, _symbol: string): Promise<bigint> {
        return 5n;
    }

    async portalBalance(_chain: string, _symbol: string): Promise<bigint> {
        return 7n;
    }

    async deposit(_chain: string, _symbol: string, _amount: bigint): Promise<any> {
        return {};
    }

    async withdraw(_chain: string, _symbol: string, _amount: bigint): Promise<any> {
        return {};
    }
}
