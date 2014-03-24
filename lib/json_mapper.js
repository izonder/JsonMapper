var util 			= require('util'),
    EventEmitter 	= require('events').EventEmitter,
    crypto          = require('crypto');

/**
 * json2json validating/mapping
 * @param config
 * @constructor
 */
function JsonMapper(config)
{
    this.config = config || {};
    this.schemas = {};
    this.compiled = {};
}

util.inherits(JsonMapper, EventEmitter);

JsonMapper.prototype.implement = function(schema, json)
{
    this.emit('begin');
    var hash = this._hash(JSON.stringify(schema));
    if(!this.compiled[hash]) {
        this.schemas[hash] = schema;
        this.compiled[hash] = this._compile(schema);
    }
    return this._apply(hash, json);
};

JsonMapper.prototype._hash = function(str)
{
    return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
};

JsonMapper.prototype._compile = function(schema)
{
    var _this = this;
    return function(json){
        _this._init(this, schema, json);
        if(!_this._require(this)) return;

        this.push('ok');
    };
};

JsonMapper.prototype._init = function(context, schema, json)
{
    Object.defineProperty(context, 'json', {
        value: json
    });

    Object.defineProperty(context, 'schema', {
        value: schema
    });

    Object.defineProperty(context, 'root', {
        value: schema.root || '/'
    });

    Object.defineProperty(context, 'index', {
        value: {},
        configurable: true,
        writable: true
    });

    Object.defineProperty(context, 'getPath', {
        value: this._getPath.bind(context)
    });
};

JsonMapper.prototype._require = function(context)
{
    var valid = true;
    if(context.schema.required && context.schema.required.length) {
        for(var i in context.schema.required) {
            if(context.schema.required.hasOwnProperty(i)) {
                var path = context.schema.required[i].replace(/\[\]/g, '0'), //при проверке достаточно проверить 0 индекс в массиве
                    val = context.getPath(path).apply(context.json);
                if(!val || (val.splice && !val[0])) valid = false;
            }
        }
    }
    return valid;
};

JsonMapper.prototype._validate = function()
{
    //TODO
};

JsonMapper.prototype._iterate = function()
{

};

JsonMapper.prototype._getPath = function(path, root)
{
    var pathSegments = typeof path == 'string' ? [this.root, path].join('').split('/') : path;

    return function(node, seg, unshift)
    {
        var val = node || root || this,
            segments = seg || pathSegments;

        //pre-filter
        do {
            var key = segments.shift();
        } while(key === '');

        //start recursion
        if(!key) {
            //nothing to do
        }
        else if((key === '[]') && (typeof val == 'object') && (typeof val.splice !== 'undefined')) {
            for(var i in val) {
                if(val.hasOwnProperty(i)) {
                    if(val[i]) val[i] = arguments.callee(val[i], segments, true);
                }
            }
        }
        else if(typeof segments.length !== 'undefined') {
            val = typeof val[key] !== 'undefined' ? arguments.callee(val[key], segments, true) : undefined;
        }
        else {
            val = undefined;
        }

        if(unshift) segments.unshift(key);
        return val;
    }
};

JsonMapper.prototype._apply = function(hash, json)
{
    var obj = [];
    try{
        this.compiled[hash].call(obj, json);
    }
    catch(e){
        this.emit('error', e);
    }
    this.emit('complete', obj);
    return obj;
};

exports.JsonMapper = JsonMapper;