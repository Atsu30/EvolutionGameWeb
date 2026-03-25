import { el, game } from './state.js';

export const flashScreen = col => {
    const f = el('damage-flash');
    f.style.transition = 'none';
    f.style.background = col;
    setTimeout(() => {
        f.style.transition = 'background 0.5s ease-out';
        f.style.background = 'transparent';
    }, 50);
};

export const shakeCamera = (time, intensity) => {
    game.st.cShkT = time;
    game.st.cShkI = intensity;
};
