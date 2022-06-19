export class Performance {
    run(callback) {
        const self = this;
        let frame = 0;
        let lastTime = Date.now();
        const fpsList = [];
        function loop() {
            const now = Date.now();
            frame++;
            if (now > 1000 + lastTime) {
                const mFps = Math.round((frame * 1000) / (now - lastTime));
                // console.log(`${new Date()} 1S内 FPS：`, mFps);
                fpsList.push(mFps);
                frame = 0;
                lastTime = now;
                callback &&
                    callback({
                        fpsList: fpsList,
                        fps: mFps,
                    });
            }
            self.rAF()(loop);
        }
        loop();
    }

    rAF() {
        return (
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            }
        );
    }
}
