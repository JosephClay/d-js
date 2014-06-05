var _         = require('_'),

    _deferObj = require('./Deferred'),
    _Deferred  = _deferObj.Deferred,
    _CALL     = _deferObj.CALL,
    _STATUS   = _deferObj.STATUS;

/**
 * The when object. It's not exposed to the user,
 * they only see a promise (with a .then() method),
 * but all the magic happens here
 */
var When = function() {
    /**
     * Store our promise
     * @type {Deferred}
     */
    this._d = null;

    /**
     * Store the deferred being listened to
     * @type {Array.<Deferred>}
     */
    this._events = [];
};

When.prototype = {
    constructor: When,

    /**
     * Called by the public when function to initialize
     * the when object
     * @return {Deferred}
     */
    init: function() {
        this._events = _.isArray(arguments[0]) ? arguments[0] : _.toArray(arguments);
        this._subscribe();

        var deferred = new _Deferred();
        this._d = deferred;
        return deferred; // Return the deferred so that it can be subscribed to
    },

    /**
     * Subscribe to the deferred passed and react
     * when they fire events
     * @private
     */
    _subscribe: function() {
        var check = _.bind(this._checkStatus, this),
            fireProgress = _.bind(this._fireProgress, this),
            events = this._events,
            idx = events.length;
        while (idx--) {
            events[idx].done(check).fail(check).progress(fireProgress);
        }
    },

    /**
     * Check the status of all deferred when
     * any one promise fires an event
     * @private
     */
    _checkStatus: function() {
        var events = this._events, evt,
            total = events.length,
            done = 0, failed = 0,
            idx = total;
        while (idx--) {
            evt = events[idx];
            // We're waiting for everything to complete
            // so if there's an item with no status, stop
            if (evt.status() === _STATUS.idle)   { return; }
            if (evt.status() === _STATUS.done)   { done += 1; continue; }
            if (evt.status() === _STATUS.failed) { failed += 1; continue; }
        }
        this._fire(total, done, failed, arguments);
    },

    /**
     * Based on the statuses of our deferred, fire the
     * appropriate events
     * @param  {Number}    total  total number of deferred
     * @param  {Number}    done   deferred in a done state
     * @param  {Number}    failed deferred in a failed state
     * @param  {Arguments} args   arguments to pass
     * @private
     */
    _fire: function(total, done, failed, args) {
        var deferred = this._d; // Our deferred

        // If everything completed, call done (this will call always)
        if (done === total) { return deferred.resolve.apply(deferred, args); }

        // If everything failed, call fail (this will call always)
        if (failed === total) { return deferred.reject.apply(deferred, args); }

        // If everything fired, but they're not all one thing, then just call always.
        // The only way to do that without exposing a public function in Deferred is
        // to use the private _fire event
        if ((done + failed) === total) { return deferred._fire(_CALL.always, args); }
    },

    /**
     * Handled separately from fire because we want to trigger
     * anytime any of the deferred progress regardless of sate
     * @private
     */
    _fireProgress: function() {
        var deferred = this._d;
        deferred.notify.apply(deferred, arguments);
    }
};

module.exports = {
    D: {
        when: function() {
            var w = new When();
            return w.init.apply(w, arguments);
        }
    }
};