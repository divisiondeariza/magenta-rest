var express = require('express');
var router = express.Router();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// Nasty, nasty hack
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.navigator = {userAgent: "Node"};
//global.document = dom.window.document;
var core = require('@magenta/music/node/core');
var coconet = require('@magenta/music/node/coconet');


const tf = require('@tensorflow/tfjs-core');
const nodeGles = require('node-gles');
const nodeGl = nodeGles.binding.createWebGLRenderingContext();

// TODO(kreeger): These are hard-coded GL integration flags. These need to be
// updated to ensure they work on all systems with proper exception reporting.
tf.env().set('WEBGL_VERSION', 2);
tf.env().set('WEBGL_RENDER_FLOAT32_ENABLED', true);
tf.env().set('WEBGL_DOWNLOAD_FLOAT_ENABLED', true);
tf.env().set('WEBGL_FENCE_API_ENABLED', true);  // OpenGL ES 3.0 and higher..
//tf.env().set('HAS_WEBGL', true);  // OpenGL ES 3.0 and higher..
tf.env().set(
    'WEBGL_MAX_TEXTURE_SIZE', nodeGl.getParameter(nodeGl.MAX_TEXTURE_SIZE));
tf.webgl.setWebGLContext(2, nodeGl);

tf.registerBackend('headless-nodegl', () => {
  // TODO(kreeger): Consider moving all GL creation here. However, weak-ref to
  // GL context tends to cause an issue when running unit tests:
  // https://github.com/tensorflow/tfjs/issues/1732
  return new tf.webgl.MathBackendWebGL(new tf.webgl.GPGPUContext(nodeGl));
}, 3 /* priority */);

tf.setBackend('headless-nodegl', true);

//require('@tensorflow/tfjs-node');

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
        temperature: 0.99
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
    input["totalQuantizedSteps"] = Math.max(...input.notes.map(note => note.quantizedEndStep));

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

