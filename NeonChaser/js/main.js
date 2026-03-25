import { game } from './state.js';
import { cam, rdr, composer, sPass } from './renderer.js';
import { setupControls } from './controls.js';
import { restartGame } from './ui.js';
import { animate } from './gameloop.js';
import './menu.js';

// Window resize handler
window.onresize = () => {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    rdr.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    sPass.uniforms.asp.value = cam.aspect;
};

// Initialize
window.onload = () => {
    setupControls();
    restartGame();
    game.clock.start();
    animate();
};
