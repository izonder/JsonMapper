var mapper = new (require('./../lib/json_mapper').JsonMapper)({});
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
    ],
    ccc: {
        nnn: 111
    }
};

//console.log(mapper.implement(map, json)['getPath']('/aaa/[]/bbb/[]/result').apply(json));
console.log(mapper.implement(map, json));
///console.log(mapper._getLeafs([7, 8, [9], [[1,2],[2,4]],[[1,2],[2,4]]]));