Scoped.define("module:Class", ["module:Types", "module:Objs", "module:Functions", "module:Ids"], function (Types, Objs, Functions, Ids) {
	var Class = function () {};

	Class.extend = function (options, objects, statics, class_statics) {
		objects = objects || [];
		if (!Types.is_array(objects))
			objects = [objects];
		statics = statics || [];
		if (!Types.is_array(statics))
			statics = [statics];
		class_statics = class_statics || [];
		if (!Types.is_array(class_statics))
			class_statics = [class_statics];
		
		var parent = this;
		
		objects = Objs.map(objects, function (obj) {
			if (Types.is_function(obj))
				obj = obj(parent.prototype);
			return obj;
		});
		
		var result;
		
		// Setup JavaScript Constructor
		Objs.iter(objects, function (obj) {
			if (obj.hasOwnProperty("constructor"))
				result = obj.constructor;
		});
		var has_constructor = Types.is_defined(result);
		if (!Types.is_defined(result))
			result = function () { parent.apply(this, arguments); };
	
		// Add Parent Statics
		Objs.extend(result, parent);
	
		// Add External Statics
		Objs.iter(statics, function (stat) {
			Objs.extend(result, Types.is_function(stat) ? stat(parent) : stat);
		});
		
		
		// Add Class Statics
		var class_statics_keys = {};
		if (parent.__class_statics_keys) {
			for (var key in parent.__class_statics_keys) 
				result[key] = Objs.clone(parent[key], 1);
		}
		Objs.iter(class_statics, function (stat) {
			Objs.extend(result, stat);
			Objs.extend(class_statics_keys, Objs.keys(stat, true));
		});
		if (parent.__class_statics_keys)
			Objs.extend(class_statics_keys, parent.__class_statics_keys);
		result.__class_statics_keys = class_statics_keys;
		
		// Parent & Children Hierarchy
		result.parent = parent;
		result.children = [];
		result.extend = this.extend;
		if (!parent.children)
			parent.children = [];
		parent.children.push(result);
		
		// Setup Prototype
		var ctor = function () {};
		ctor.prototype = parent.prototype;
		result.prototype = new ctor();
	
		result.prototype.cls = result;
	
		
		options = Objs.extend({
		}, Types.is_string(options) ? {
			classname: options,
			register: true
		} : options);
		
		var classname = options.classname;
		if (options.scoped)
			classname = options.scoped.ns.path;
		
		result.classname = classname;
		if (classname && options.register)
			Scoped.setGlobal(classname, result);
		
		// Setup Prototype
		result.__notifications = {};
		
		if (parent.__notifications)
			Objs.extend(result.__notifications, parent.__notifications, 1);		
	
		Objs.iter(objects, function (object) {
			Objs.extend(result.prototype, object);
	
			// Note: Required for Internet Explorer
			if ("constructor" in object)
				result.prototype.constructor = object.constructor;
	
			if (object._notifications) {
				for (var key in object._notifications) {
					if (!result.__notifications[key])
						result.__notifications[key] = [];
					result.__notifications[key].push(object._notifications[key]);
				}
			}
		});	
		delete result.prototype._notifications;
	
		if (!has_constructor)
			result.prototype.constructor = parent.prototype.constructor;
			
		return result; 
	};
	
	
	/*
	 * 
	 * Extending the Class
	 * 
	 */
	
	Objs.extend(Class, {
		
		classname: "Class",
		
		__class_guid: "0f5499f9-f0d1-4c6c-a561-ef026a1eee05",	
		
		__notifications: {},
		
		ancestor_of: function (cls) {
			return (this == cls) || (this != Class && this.parent.ancestor_of(cls));
		},
		
		is_class: function (cls) {
			return cls && Types.is_object(cls) && ("__class_guid" in cls) && cls.__class_guid == this.__class_guid;
		},
		
		is_class_instance: function (obj) {
			return obj && Types.is_object(obj) && ("__class_instance_guid" in obj) && obj.__class_instance_guid == this.prototype.__class_instance_guid;
		},
		
		is_instance_of: function (obj) {
			return obj && this.is_class_instance(obj) && obj.instance_of(this);
		},
		
		// Legacy Methods
	
		_inherited: function (cls, func) {
			return cls.parent[func].apply(this, Array.prototype.slice.apply(arguments, [2]));
		}	
		
	});
	
	
	
	
	
	
	/*
	 * 
	 * Extending the Object
	 * 
	 */
	
	
	Objs.extend(Class.prototype, {
		
		__class_instance_guid: "e6b0ed30-80ee-4b28-af02-7d52430ba45f",
		
		constructor: function () {
			this._notify("construct");
		},
		
		destroy: function () {
			this._notify("destroy");
			if (this.__auto_destroy_list) {
				for (var i = 0; i < this.__auto_destroy_list.length; ++i) {
					if ("destroy" in this.__auto_destroy_list[i])
						this.__auto_destroy_list[i].destroy();
				}
			}
			for (var key in this)
				delete this[key];
		},
		
		cid: function () {
			return Ids.objectId(this);
		},
	
		cls: Class,
		
		as_method: function (s) {
			return Functions.as_method(this[s], this);
		},
		
		auto_destroy: function (obj) {
			if (!this.__auto_destroy_list)
				this.__auto_destroy_list = [];
			var target = obj;
			if (!Types.is_array(target))
			   target = [target];
			for (var i = 0; i < target.length; ++i)
			   this.__auto_destroy_list.push(target[i]);
			return obj;
		},
		
		_notify: function (name) {
			if (!this.cls.__notifications)
				return;
			var rest = Array.prototype.slice.call(arguments, 1);
			Objs.iter(this.cls.__notifications[name], function (entry) {
				var method = Types.is_function(entry) ? entry : this[entry];
				if (!method)
					throw this.cls.classname  + ": Could not find " + name + " notification handler " + entry;
				method.apply(this, rest);
			}, this);
		},
		
		instance_of: function (cls) {
			return this.cls.ancestor_of(cls);
		},
		
		// Legacy Methods
		
		_auto_destroy: function(obj) {
			return this.auto_destroy(obj);
		},
		
		_inherited: function (cls, func) {
			return cls.parent.prototype[func].apply(this, Array.prototype.slice.apply(arguments, [2]));
		}
		
	});

	return Class;

});
	