import assert from 'node:assert/strict';
import {createCamera,centerCamera,clampCamera,worldToScreen} from '../lab/field-camera.js';
const camera=createCamera(1920,1120);
for(const zoom of [.55,1,1.8])for(const p of [{x:142,y:894},{x:1058,y:406},{x:1770,y:1080}]){
  camera.zoom=zoom;centerCamera(camera,p);clampCamera(camera);
  assert.deepEqual(worldToScreen(camera,p),{x:480,y:300});
  assert.equal(camera.zoom,zoom);
}
camera.edgeCenter=false;camera.x=-100;camera.y=2000;clampCamera(camera);
assert.ok(camera.x>0&&camera.y<camera.height,'normal camera bounds are retained when focus mode is reset');
console.log('PASS: selected actor centering, elevated projected position, edge centering, unchanged zoom, reset bounds');
