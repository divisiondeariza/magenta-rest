var express = require('express');
var router = express.Router();


const tf_node = require('@tensorflow/tfjs-node');
const tf = require('@tensorflow/tfjs');

// Nasty, nasty hack
global.navigator = {userAgent: "Node"};

var coconet = require('@magenta/music/node/coconet');
var core = require('@magenta/music/node/core');
const model_url = 'https://storage.googleapis.com/magentadata/js/checkpoints/coconet/bach';
var model = new coconet.Coconet(model_url);

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
        temperature: 0.99,
        numIterations: 10000,
    }).then((output) =>{
        res.send(output);
    }).catch((reason)=>{
        console.log(reason);
    });
});

router.post('/', (req, res, next) => {

    var note_sequence = req.body.note_sequence
    var temperature = req.body.temperature || 0.99;
    input = core.sequences.concatenate([note_sequence]);
    input["totalQuantizedSteps"] = Math.max(input.notes.map(note => note.quantizedEndStep)) + 1;

    model.infill(input, {
        temperature: 0.99,
    }).then((output) => {
        var seq = core.sequences.mergeConsecutiveNotes(output);
        res.send(seq);
    }).catch((reason) => {
        console.log(input);
        console.log(reason);
        res.status(500).send();
    });

});

module.exports = router;

