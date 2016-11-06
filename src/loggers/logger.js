Scoped.define("module:Loggers.Logger", [
	"module:Class",
	"module:Objs",
	"module:Functions"
], function (Class, Objs, Functions, scoped) {
	var Cls = Class.extend({scoped: scoped}, function (inherited) {
		
		/**
		 * Logger Class
		 * 
		 * @class BetaJS.Loggers.Logger
		 */
		return {
			
			/**
			 * Creates a new instance.
			 * 
			 * @param {object} options options for the logger
			 */
			constructor: function (options) {
				inherited.constructor.call(this);
				options = options || {};
				this.__listeners = {};
				this.__tags = options.tags || [];
				Objs.iter(options.listeners, this.addListener, this);
			},
			
			/**
			 * Adds a new listener to the logger.
			 * 
			 * @param {object} listener listener to be added
			 */
			addListener: function (listener) {
				this.__listeners[listener.cid()] = listener;
				return this;
			},
			
			/**
			 * Remove an existing listener from the logger.
			 * 
			 * @param {object} listener listener to be removed
			 */
			removeListener: function (listener) {
				delete this.__listeners[listener.cid()];
				return this;
			},
			
			/**
			 * Create a new log message.
			 */
			log: function () {
				return this.message(this, {
					type: "log",
					args: Functions.getArguments(arguments, 0)
				});
			},
			
			/**
			 * Creates a log function calling the logger.
			 */
			logf: function () {
				return Functions.as_method(this.log, this);
			},
			
			/**
			 * Create a new warn message.
			 */
			warn: function () {
				return this.message(this, {
					type: "warn",
					args: Functions.getArguments(arguments, 0)
				});
			},
			
			/**
			 * Create a new error message.
			 */
			error: function () {
				return this.message(this, {
					type: "error",
					args: Functions.getArguments(arguments, 0)
				});
			},
			
			/**
			 * Create a new tagged log message.
			 * 
			 * @param {array} tags tags for the message
			 */
			taggedlog: function (tags) {
				return this.message(this, {
					type: "log",
					tags: tags,
					args: Functions.getArguments(arguments, 1)
				});
			},
			
			/**
			 * Create a new tagged warn message.
			 * 
			 * @param {array} tags tags for the message
			 */
			taggedwarn: function (tags) {
				return this.message(this, {
					type: "warn",
					tags: tags,
					args: Functions.getArguments(arguments, 1)
				});
			},

			/**
			 * Create a new tagged error message.
			 * 
			 * @param {array} tags tags for the message
			 */
			taggederror: function (tags) {
				return this.message(this, {
					type: "error",
					tags: tags,
					args: Functions.getArguments(arguments, 1)
				});
			},

			/**
			 * Create a new log message.
			 * 
			 * @param {object} source logger source for message
			 * @param {object} msg log message
			 */
			message: function (source, msg) {
				Objs.iter(this.__listeners, function (listener) {
					msg.tags = this.__tags.concat(msg.tags || []);
					listener.message(this, msg);
				}, this);
				return this;
			},
			
			/**
			 * Create a new sub logger by tags.
			 *
			 * @return {object} sub logger
			 */
			tag: function () {
				return new Cls({
					tags: Functions.getArguments(arguments),
					listeners: [this]
				});
			}
			
		};
	}, {
		
		/**
		 * Return global singleton logger instance.
		 * 
		 * @return {object} singleton logger
		 */
		global: function () {
			if (!this.__global)
				this.__global = new Cls();
			return this.__global;
		}
		
	});
	
	return Cls;
});