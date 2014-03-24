var mapper = new (require('./../lib/json_mapper').JsonMapper);
var map = require('./../map/map.json');
var json = {
    aaa: [
        {
            bbb: [
                {
                    result: "ok11"
                },
                {
                    result: "ok12"
                }
            ]
        },
        {
            bbb: [
                {
                    result: "ok21"
                },
                {
                    result: "ok22"
                }
            ]
        }
    ]
};

//console.log(mapper.implement(map, json)['getPath']('/aaa/[]/bbb/[]/result').apply(json));
console.log(mapper.implement(map, json));