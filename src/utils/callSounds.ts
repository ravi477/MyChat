// Call notification sound
export const playRingtone = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi2Fzvnci0YPF2W55eqVRxIkWq/n6qBVDA==');
    audio.loop = true;
    audio.play().catch(console.error);
    return audio;
};

export const stopRingtone = (audio: HTMLAudioElement | null) => {
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
};

// Success sound (call connected)
export const playConnectedSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRigBAABXQVZFZm10IBAAAAABAAEAgD4AAIA+AAABAAgAZGF0YRAEAAB9gIGDhYaHiYqKi4yLi4qJiIyMjI2OkJGTlJaYmJqbnJ2en6ChoqOkpaanqKmqqaqqq6utrrCxsrK0tba4uru8vb7AwcLExcfIycvMzs/R0tPV1tjZ297i5ejr7fL3/f8=');
    audio.play().catch(console.error);
};
