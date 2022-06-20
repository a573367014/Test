import { Curve } from '../core/Curve.js';
import { Vector2 } from '../../math/Vector2.js';

export class EllipseCurve extends Curve {
    constructor(aX, aY, xRadius, yRadius, startAngle, endAngle, clockwise, rotation) {
        super();

        this.type = 'EllipseCurve';

        this.aX = aX || 0;
        this.aY = aY || 0;

        this.xRadius = xRadius || 1;
        this.yRadius = yRadius || 1;

        this.startAngle = startAngle || 0;
        this.endAngle = endAngle || 2 * Math.PI;

        this.clockwise = clockwise || false;

        this.rotation = rotation || 0;
        this.isEllipseCurve = true;
    }

    getPoint(t) {
        const twoPi = Math.PI * 2;
        const { aX, aY, rotation, xRadius, yRadius, startAngle, endAngle } = this;
        let angle = startAngle + t * (endAngle - startAngle);
        angle %= twoPi;
        if (angle < 0) {
            angle += twoPi;
        }
        let x = aX + xRadius * Math.cos(angle);
        let y = aY + yRadius * Math.sin(angle);

        if (rotation) {
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);

            const tx = x - aX;
            const ty = y - aY;

            // Rotate the point about the center of the ellipse.
            x = tx * cos - ty * sin + aX;
            y = tx * sin + ty * cos + aY;
        }

        return new Vector2(x, y);
    }

    copy(source) {
        super.copy(source);

        this.aX = source.aX;
        this.aY = source.aY;

        this.xRadius = source.xRadius;
        this.yRadius = source.yRadius;

        this.startAngle = source.aStartAngle;
        this.endAngle = source.aEndAngle;

        this.clockwise = source.aClockwise;

        this.rotation = source.aRotation;

        return this;
    }
}
