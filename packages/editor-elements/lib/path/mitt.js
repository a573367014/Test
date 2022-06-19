// An event handler can take an optional event argument
// and should not return a value
// An array of all currently registered event handlers for a type
// A map of event types and their corresponding event handlers.

/**
 * Mitt: Tiny (~200b) functional event emitter / pubsub.
 * @name mitt
 * @returns {Mitt}
 */
export function mitt(all) {
  all = all || new Map();
  return {
    /**
     * A Map of event names to registered handler functions.
     */
    all: all,

    /**
     * Register an event handler for the given type.
     * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
     * @param {Function} handler Function to call in response to given event
     * @memberOf mitt
     */
    on: function on(type, handler) {
      var handlers = all.get(type);

      if (handlers) {
        handlers.push(handler);
      } else {
        all.set(type, [handler]);
      }
    },

    /**
     * Remove an event handler for the given type.
     * If `handler` is omitted, all handlers of the given type are removed.
     * @param {string|symbol} type Type of event to unregister `handler` from (`'*'` to remove a wildcard handler)
     * @param {Function} [handler] Handler function to remove
     * @memberOf mitt
     */
    off: function off(type, handler) {
      var handlers = all.get(type);

      if (handlers) {
        if (handler) {
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        } else {
          all.set(type, []);
        }
      }
    },

    /**
     * Invoke all handlers for the given type.
     * If present, `'*'` handlers are invoked after type-matched handlers.
     *
     * Note: Manually firing '*' handlers is not supported.
     *
     * @param {string|symbol} type The event type to invoke
     * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
     * @memberOf mitt
     */
    emit: function emit(type, evt) {
      var handlers = all.get(type);

      if (handlers) {
        handlers.slice().map(function (handler) {
          handler(evt);
        });
      }

      handlers = all.get('*');

      if (handlers) {
        handlers.slice().map(function (handler) {
          handler(type, evt);
        });
      }
    }
  };
}