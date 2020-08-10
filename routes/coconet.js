var express = require('express');
var router = express.Router();
var core = require('@magenta/music/node/core');

// Nasty, nasty hack
global.navigator = {userAgent: "Node"};


var coconet = require('@magenta/music/node/coconet');


var model = new coconet.Coconet('https://storage.googleapis.com/magentadata/js/checkpoints/coconet/bach');

/* Generate NoteSequences from Coconet Model */

model.initialize();


router.get('/', function(req, res, next){
    var sequence = {notes:[
        { pitch: 64,
            instrument: "0",
            quantizedStartStep: 0,
            quantizedEndStep: 3
          }
    ], quantizationInfo: {stepsPerQuarter: 4}};


    model.infill(sequence, {
        temperature: 0.99
    }).then((output) =>{
        res.send(output);
    });
});

module.exports = router;
