var util 			= require('util'),
    EventEmitter 	= require('events').EventEmitter,
    crypto          = require('crypto');

/**
 * json2json validating/mapping
 * @param config
 * @constructor
 */
function JsonMapper(config, logger)
{
    this.config = config || {};
    this.schemas = {};
    this.compiled = {};
    this.logger = logger || console;
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
        if(!_this._require(this)) {
            _this.logger.log('Require test failed!');
            return;
        }
        if(!_this._validate(this)) {
            _this.logger.log('Validate test failed!');
            return;
        }

        //маппинг
        _this._iterate(this, this.schema.loop || {});
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

JsonMapper.prototype._validate = function(context)
{
    var valid = true;
    if(context.schema.validate && typeof context.schema.validate == 'object') {
        for(var i in context.schema.validate) {
            if(context.schema.validate.hasOwnProperty(i)) {
                var values = this._getLeafs(context.getPath(i).apply(context.json));
                if(values && values.length) {
                    for(var n in values) {
                        if(values.hasOwnProperty(n)) {
                            if(/^=>/.test(context.schema.validate[i]) ? !this._callable(context.schema.validate[i], values[n]) : values[n] !== context.schema.validate[i]) valid = false;
                            return valid;
                        }
                    }
                }
                else {
                    valid = false; //путь не найден
                    return valid;
                }
            }
        }
    }
    return valid;
};

JsonMapper.prototype._getLeafs = function(sourceArray)
{
    var needExpand = true,
        targetArray = sourceArray,
        temporaryArray = [];

    while(needExpand) {
        temporaryArray = [];
        needExpand = false;
        if(targetArray && targetArray.length) {
            for(var i in targetArray) {
                if(targetArray.hasOwnProperty(i)) {
                    if(targetArray[i] && (typeof targetArray[i] == 'object') && targetArray[i].splice) needExpand = true;
                    temporaryArray = temporaryArray.concat(targetArray[i]);
                }
            }
        }
        else {
            if(targetArray && targetArray.splice && !targetArray.length) temporaryArray = [];
            else temporaryArray = temporaryArray.concat(targetArray);
        }
        targetArray = temporaryArray;
    }
    return targetArray;
};

JsonMapper.prototype._iterate = function(context, loop, rootPath)
{
    if(loop && typeof loop == 'object' && loop.path) {
        var path = loop.path.replace(/^@/, rootPath || ''),
            items = context.getPath(path).apply(context.json);

        if(items && items.length) {
            items.forEach(this._item.bind(this, context, loop, path));
        }
    }
    else {
        this._as(context);
    }
};

JsonMapper.prototype._item = function(context, loop, rootPath, item, i)
{
    var path = [rootPath, '/', i].join('');
    context.index[loop.index] = i;
    this._iterate(context, loop.loop || {}, path);
};

JsonMapper.prototype._as = function(context)
{
    //context.push('ok');
    var obj = {}
    for(var i in context.schema.as){ //TODO - рекурсия
        obj[i] = context.getPath(context.schema.as[i]).apply(context.json)
    }
    context.push(obj);
};

JsonMapper.prototype._callable = function(code, value)
{
    var result = false;
    try {
        result = eval(code.replace(/^=>\s*/, '').replace(/@/g, ' value '));
    }
    catch(e) {
        this.logger.warn('Callable evaluate error:', code, e.stack);
    }
    return typeof result == 'boolean' ? result : result === value;
};

JsonMapper.prototype._getPath = function(path, root)
{
    var _this = this,
        pathSegments = typeof path == 'string' ? [this.root, path].join('').split('/') : path;

    return function(node, seg, unshift) //TODO: разобраться с undefined
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
                if(val.hasOwnProperty(i)) {console.log(i, val[i]);
                    val[i] = arguments.callee(val[i], segments, true);
                }
            }
        }
        else if(/\*/.test(key) && (typeof val == 'object')) {
            var pcre = new RegExp('^' + key.replace('*', '.*') + '$'),
                tmp = [];
            for(var i in val) {
                if(val.hasOwnProperty(i)) {
                    if(pcre.test(i)) tmp.push(arguments.callee(val[i], segments, true));
                }
            }
            val = tmp;
        }
        else if(/^@/.test(key) && (typeof val == 'object')) {
            key = key.substr(1);//console.log(_this.index[key], val[_this.index[key]]);
            val = typeof val[_this.index[key]] !== 'undefined' ? arguments.callee(val[_this.index[key]], segments, true) : undefined;
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