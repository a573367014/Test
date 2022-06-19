<template>
    <svg viewBox="0 0 22 23" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg">
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M16.752 8.526C16.409 5.623 13.965 3.372 11 3.372S5.59 5.623 5.249 8.525c-2.394.551-4.18 2.715-4.18 5.3 0 3.002 2.409 5.436 5.38 5.436h9.102l.193-.003c2.882-.103 5.186-2.496 5.186-5.433 0-2.585-1.786-4.749-4.178-5.299zm-9.67.148a3.973 3.973 0 017.862.18l.132 1.112 1.093.249.165.042a3.577 3.577 0 01-.836 7.016l-.157.002h-8.71l-.17-.004a3.575 3.575 0 01-.63-7.057l1.093-.249.132-1.112.026-.18z"
        />
        <circle class="eui-v2-icon--saving__0" cx="7.5" cy="13.25" r="1.25"></circle>
        <circle class="eui-v2-icon--saving__1" cx="11" cy="13.25" r="1.25"></circle>
        <circle class="eui-v2-icon--saving__2" cx="14.5" cy="13.25" r="1.25"></circle>
    </svg>
</template>

<script>
export default {};
</script>

<style lang="less">
@keyframes v2-saving-animate {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(0);
    }

    100% {
        transform: scale(1);
    }
}
.eui-v2-icon--saving__animate(@delay) {
    animation-name: v2-saving-animate;
    animation-iteration-count: infinite;
    animation-delay: @delay;
    animation-duration: 1s;
}

.eui-v2-icon--saving {
    &__0 {
        .eui-v2-icon--saving__animate(0s);
        transform-origin: 7.5px 13.25px;
    }

    &__1 {
        .eui-v2-icon--saving__animate(0.2s);
        transform-origin: 11px 13.25px;
    }

    &__2 {
        .eui-v2-icon--saving__animate(0.4s);
        transform-origin: 14.5px 13.25px;
    }
}
</style>
