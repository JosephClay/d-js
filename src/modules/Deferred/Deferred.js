// DOC: Does not support "resolveWith", "rejectWith" etc...
// DOC: Does not support deprecated methods "isRejected", "isResolved" etc...
    /**
     * Status values, determines
     * what the promise's status is
     * @readonly
     * @enum {Number}
     */
var _ = require('underscore');

var _DEFERRED_STATUS = {
        idle:       0,
        progressed: 1,
        failed:     2,
        done:       3
    },
    /**
     * Call values, used to determine
     * what kind of functions to call
     * @readonly
     * @enum {Number}
     * @alias Deferred.CALL
     */
    _DEFERRED_CALL = {
        done:     0,
        fail:     1,
        always:   2,
        progress: 3,
        pipe:     4
    },

    // Invert _DEFERRED_CALL
    _DEFERRED_CALL_NAME = (function(obj) {
        var result = {},
            key;
        for (key in obj) {
            result[obj[key]] = key;
        }

        return result;
    }(_DEFERRED_CALL)),

    _PROMISE_KEYS = _.splt('done|fail|always|progress|pipe|then');

/**
 * A lightweight implementation of promises.
 * API based on {@link https://api.jquery.com/promise/ jQuery.promises}
 * @class Deferred
 */
var Deferred = function(beforeStart) {
    if (!(this instanceof Deferred)) { return new Deferred(beforeStart); }

    /**
     * Registered functions organized by _DEFERRED_CALL
     * @type {Object}
     * @private
     */
    this._calls = {};

    /**
     * Current status
     * @type {Number}
     * @private
     */
    this._status = _DEFERRED_STATUS.idle;

    if (beforeStart) { beforeStart.call(this, this); }
};

Deferred.prototype = /** @lends Deferred# */ {
    constructor: Deferred,

    /**
     * Register a done call that is fired after a Deferred is resolved
     * @param  {Function} func
     * @return {Deferred}
     */
    done: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.done, func); },

    /**
     * Register a fail call that is fired after a Deferred is rejected
     * @param  {Function} func
     * @return {Deferred}
     */
    fail: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.fail, func); },
    /**
     * Register a call that fires after done or fail
     * @param  {Function} func
     * @return {Deferred}
     */
    always: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.always, func); },
    /**
     * Register a progress call that is fired after a Deferred is notified
     * @param  {Function} func
     * @return {Deferred}
     */
    progress: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.progress, func); },
    /**
     * Register a pipe call that is fired before done or fail and whose return value
     * is passed to the next pipe/done/fail call
     * @param  {Function} func
     * @return {Deferred}
     */
    pipe: function(func) { return this._pushCall.call(this, _DEFERRED_CALL.pipe, func); },

    /**
     * Proxy to done, fail, progress
     * @param  {Function} done
     * @param  {Function} fail
     * @param  {Function} progress
     * @return {Deferred}
     */
    then: function(done, fail, progress) {
        if (done) { this.done(done); }
        if (fail) { this.fail(fail); }
        if (progress) { this.progress(progress); }
        return this;
    },

    /**
     * Returns a protected promise object that
     * cannot be resolved/rejected, only subscribed to
     * @param  {Object} [obj]
     * @return {Object} promise
     */
    // DOC: No "type" passed as we are not supporting "fx"
    promise: function(obj) {
        var self = this,
            result = obj || {};

        var idx,
            len = _PROMISE_KEYS.length,
            key;
        for (idx = 0; idx < len; idx++) {
            key = _PROMISE_KEYS[idx];
            result[key] = self[key].bind(self);
        }

        return result;
    },

    // See: http://api.jquery.com/deferred.state/
    state: function() {
        if (this._status === _DEFERRED_STATUS.idle || this._status === _DEFERRED_STATUS.progressed) {
            return 'pending';
        }

        if (this._status === _DEFERRED_STATUS.failed) {
            return 'rejected';
        }

        if (this._status === _DEFERRED_STATUS.done) {
            return 'resolved';
        }
    },

    /**
     * Pushes a function into a call array by type
     * @param  {Deferred.CALL} callType
     * @param  {Function} func
     * @private
     */
    _pushCall: function(callType, func) {
        this._getCalls(callType).push(func);
        return this;
    },

    /**
     * Notify the promise - calls any functions in
     * Deferred.progress
     * @return {Deferred}
     */
    notify: function() {
        this._status = _DEFERRED_STATUS.progressed;

        var args = this._runPipe(arguments);
        this._fire(_DEFERRED_CALL.progress, args)._fire(_DEFERRED_CALL.always, args);

        return this;
    },

    /**
     * Reject the promise - calls any functions in
     * Deferred.fail, then calls any functions in
     * Deferred.always
     * @return {Deferred}
     */
    reject: function() {
        // If we've already called failed or done, go no further
        if (this._status === _DEFERRED_STATUS.failed || this._status === _DEFERRED_STATUS.done) { return this; }

        this._status = _DEFERRED_STATUS.failed;

        // Never run the pipe on fail. Simply fail.
        // Running the pipe after an unexpected failure may lead to
        // more failures
        this._fire(_DEFERRED_CALL.fail, arguments)
            ._fire(_DEFERRED_CALL.always, arguments);

        this._cleanup();

        return this;
    },

    /**
     * Resolve the promise - calls any functions in
     * Deferred.done, then calls any functions in
     * Deferred.always
     * @return {Deferred}
     */
    resolve: function() {
        // If we've already called failed or done, go no further
        if (this._status === _DEFERRED_STATUS.failed || this._status === _DEFERRED_STATUS.done) { return this; }

        this._status = _DEFERRED_STATUS.done;

        var args = this._runPipe(arguments);
        this._fire(_DEFERRED_CALL.done, args)
            ._fire(_DEFERRED_CALL.always, args);

        this._cleanup();

        return this;
    },

    /**
     * Fires a _DEFERRED_CALL type with the provided arguments
     * @param  {Deferred.CALL} callType
     * @param  {Array} args
     * @param  {*} context
     * @return {Deferred}
     * @private
     */
    _fire: function(callType, args, context) {
        var calls = this._getCalls(callType),
            idx = 0, length = calls.length;
        for (; idx < length; idx++) {
            calls[idx].apply(null, args);
        }
        return this;
    },

    /**
     * Runs the pipe, catching the return value
     * to pass to the next pipe. Returns the
     * arguments to used by the calling method
     * to proceed to call other methods (e.g. done/fail/always)
     * @param  {Array} args
     * @return {Array} args
     * @private
     */
    _runPipe: function(args) {
        var pipes = this._getCalls(_DEFERRED_CALL.pipe),
            idx = 0, length = pipes.length, val;
        for (; idx < length; idx++) {
            val = pipes[idx].apply(null, args);
            if (val !== undefined) { args = [val]; }
        }

        return args;
    },

    /**
     * Lazy generate arrays based on type to
     * avoid creating disposable arrays for
     * methods that aren't going to be used/called
     * @param  {Deferred.CALL} type
     * @return {Array}
     * @private
     */
    _getCalls: function(type) {
        return this._calls[_DEFERRED_CALL_NAME[type]] || (this._calls[_DEFERRED_CALL_NAME[type]] = []);
    },

    /**
     * Cleanup references to functions stored in
     * arrays that are no longer able to be called
     * @private
     */
    _cleanup: function() {
        this._getCalls(_DEFERRED_CALL.done).length = 0;
        this._getCalls(_DEFERRED_CALL.fail).length = 0;
        this._getCalls(_DEFERRED_CALL.always).length = 0;
    }
};

module.exports = {
    Deferred: Deferred,
    STATUS: _DEFERRED_STATUS,
    CALL: _DEFERRED_CALL,

    D: {
        Deferred: Deferred
    }
};