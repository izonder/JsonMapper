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

var json2 = {
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
        },
        {
            bbb: [
                {
                    result: "ok31"
                },
                {
                    result: "ok32"
                }
            ]
        }
    ],
    ccc: {
        nnn: 222
    }
};

//console.log(mapper.implement(map, json)['getPath']('/aaa/[]/bbb/[]/result').apply(json));
console.log(Date.now());
console.log(mapper.implement(map, json));
console.log(Date.now());
console.log(mapper.implement(map, json));
console.log(Date.now());
console.log(mapper.implement(map, json2));
console.log(Date.now());
///console.log(mapper._getLeafs([7, 8, [9], [[1,2],[2,4]],[[1,2],[2,4]]]));