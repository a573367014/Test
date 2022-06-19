export function loadScript(src, callback) {
    const script = document.createElement('script');
    const head = document.getElementsByTagName('head')[0];
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.src = src;
    if (script.addEventListener) {
        script.addEventListener(
            'load',
            function () {
                callback();
            },
            false,
        );
    } else if (script.attachEvent) {
        script.attachEvent('onreadystatechange', function () {
            const target = window.event.srcElement;
            if (target.readyState === 'loaded') {
                callback();
            }
        });
    }
    head.appendChild(script);
}

export function checkIsColor(bgVal) {
    let type = '';
    if (/^rgb\(/.test(bgVal)) {
        // 如果是rgb开头，200-249，250-255，0-199
        type =
            '^[rR][gG][Bb][(]([\\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\\s]*,){2}[\\s]*(2[0-4]\\d|25[0-5]|[01]?\\d\\d?)[\\s]*[)]{1}$';
    } else if (/^rgba\(/.test(bgVal)) {
        // 如果是rgba开头，判断0-255:200-249，250-255，0-199 判断0-1：0 1 1.0 0.0-0.9
        type =
            '^[rR][gG][Bb][Aa][(]([\\s]*(2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?)[\\s]*,){3}[\\s]*(1|1.0|0|0.[0-9])[\\s]*[)]{1}$';
    } else if (/^#/.test(bgVal)) {
        // 六位或者三位
        type = '^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$';
    } else if (/^hsl\(/.test(bgVal)) {
        // 判断0-360 判断0-100%(0可以没有百分号)
        type =
            '^[hH][Ss][Ll][(]([\\s]*(2[0-9][0-9]|360｜3[0-5][0-9]|[01]?[0-9][0-9]?)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*)[)]$';
    } else if (/^hsla\(/.test(bgVal)) {
        type =
            '^[hH][Ss][Ll][Aa][(]([\\s]*(2[0-9][0-9]|360｜3[0-5][0-9]|[01]?[0-9][0-9]?)[\\s]*,)([\\s]*((100|[0-9][0-9]?)%|0)[\\s]*,){2}([\\s]*(1|1.0|0|0.[0-9])[\\s]*)[)]$';
    }
    const re = new RegExp(type);
    return bgVal.match(re)[0].length;
}
