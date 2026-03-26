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
    game.st.isP = true; // タイトル画面で一時停止
    game.clock.start();
    animate();
};
