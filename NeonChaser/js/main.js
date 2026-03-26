// --- Initialize ---
window.onresize = () => {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    rdr.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    sPass.uniforms.asp.value = cam.aspect;
};

window.onload = () => {
    setupControls();
    restartGame();
    game.clock.start();
    animate();
};
