import type { IEffectMask } from '../../types/effect/effect-mask';

export function clipImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | HTMLCanvasElement,
    mask: IEffectMask,
) {
    ctx.beginPath();
    ctx.translate(img.width / 2, img.height / 2);
    const radius = Math.min(img.width, img.height) / 2;
    let path: Path2D | undefined;
    switch (mask.type) {
        case 'custom':
            path = rectRoundedPath(img.width / 2, img.height / 2, mask.radius);
            break;
        case 'circle':
            path = circlePath(radius);
            break;
        case 'star':
            if (mask.star) {
                path = starPath(
                    radius,
                    radius * mask.star.ratio,
                    mask.star.number,
                    mask.star.angle,
                    mask.star.rounded,
                );
            } else {
                path = starPath(radius, radius / 2);
            }
            break;
        case 'diamond':
            path = starPath(radius, radius, 2, 0);
            break;
        case 'rectRounded':
            path = rectRoundedPath(radius, radius);
            break;
        case 'rectRoundedTopLeftAndRightBottom':
            path = rectRoundedPath(radius, radius, radius / 2, false);
            break;
        case 'heart':
            path = heartPath(radius);
            break;
        case 'parallelogram':
            path = parallelogramPath(radius);
            break;
    }
    if (path) {
        ctx.clip(path);
    }
    ctx.translate(-img.width / 2, -img.height / 2);
    ctx.drawImage(img, 0, 0);
}
function circlePath(radius) {
    const path = new Path2D();
    path.arc(0, 0, radius, 0, 2 * Math.PI, true);
    return path;
}
function starPath(ra, rb, n = 5, initAngle = 0, rounded = 0) {
    const angleOff = -Math.PI / 2 + (initAngle * Math.PI) / 180;
    const path = new Path2D();
    if (!rounded) {
        path.moveTo(ra * Math.cos(angleOff), ra * Math.sin(angleOff));
        for (let i = 1; i <= n * 2; i++) {
            const angle = (i * Math.PI) / n + angleOff;
            const r = i % 2 ? rb : ra;
            path.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }
    } else {
        path.moveTo(ra * Math.cos(angleOff), ra * Math.sin(angleOff));
        const c = rounded / 2;
        for (let i = 1; i <= n * 2; i++) {
            const angle = (i * Math.PI) / n + angleOff;
            const r1 = i % 2 ? ra : rb;
            const r2 = i % 2 ? rb : ra;
            const p1 = [r1 * Math.cos(angle - Math.PI / n), r1 * Math.sin(angle - Math.PI / n)];
            const p2 = [r2 * Math.cos(angle), r2 * Math.sin(angle)];
            const p3 = [r1 * Math.cos(angle + Math.PI / n), r1 * Math.sin(angle + Math.PI / n)];

            path.lineTo((p1[0] - p2[0]) * c + p2[0], (p1[1] - p2[1]) * c + p2[1]);
            path.quadraticCurveTo(
                p2[0],
                p2[1],
                (p3[0] - p2[0]) * c + p2[0],
                (p3[1] - p2[1]) * c + p2[1],
            );
        }
    }

    return path;
}

function rectRoundedPath(width, height, radius = width / 2, isAllRounded = true) {
    const path = new Path2D();
    path.moveTo(width, -height + radius);
    path.arcTo(width, height, -width + radius, height, radius);
    if (isAllRounded) {
        path.arcTo(-width, height, -width, -height, radius);
    } else {
        path.lineTo(-width, height);
        path.lineTo(-width, -height + radius);
    }
    path.arcTo(-width, -height, -width + radius, -height, radius);
    if (isAllRounded) {
        path.arcTo(width, -height, width, -height + radius, radius);
    } else {
        path.lineTo(width, -height);
        path.lineTo(width, -height + radius);
    }
    return path;
}

function heartPath(radius) {
    const path = new Path2D();
    const ratio = radius == null ? 1 : radius / 60;
    path.moveTo(0, -30 * ratio);
    path.bezierCurveTo(0, -33 * ratio, -10 * ratio, -45 * ratio, -25 * ratio, -45 * ratio);
    path.bezierCurveTo(
        -55 * ratio,
        -45 * ratio,
        -55 * ratio,
        -15 * ratio,
        -55 * ratio,
        -15 * ratio,
    );
    path.bezierCurveTo(-55 * ratio, 10 * ratio, -35 * ratio, 32 * ratio, 0, +50 * ratio);
    path.bezierCurveTo(35 * ratio, 32 * ratio, 55 * ratio, 10 * ratio, 55 * ratio, -15 * ratio);
    path.bezierCurveTo(55 * ratio, -15 * ratio, 55 * ratio, -45 * ratio, 25 * ratio, -45 * ratio);
    path.bezierCurveTo(10 * ratio, -45 * ratio, 0, -33 * ratio, 0, -30 * ratio);
    return path;
}
function parallelogramPath(radius) {
    const path = new Path2D();
    path.moveTo(radius / 2, radius);
    path.lineTo(-radius, radius);
    path.lineTo(-radius / 2, -radius);
    path.lineTo(radius, -radius);
    path.lineTo(radius / 2, radius);
    return path;
}
