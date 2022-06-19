<template>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="1em"
        height="1em"
        viewBox="0 0 14.95 14.82"
        fill="currentColor"
    >
        <path
            d="M7.48 0a.74.74 0 0 1 .73.74v2.94a.74.74 0 0 1-.73.74.74.74 0 0 1-.74-.74V.74A.74.74 0 0 1 7.48 0z"
            class="eui-v2-icon--loader__0"
        ></path>
        <path
            d="M11.56 1.2a.74.74 0 0 1 .22 1l-1.6 2.47a.74.74 0 0 1-1 .22.74.74 0 0 1-.22-1l1.61-2.47a.73.73 0 0 1 .99-.22z"
            class="eui-v2-icon--loader__1"
        ></path>
        <path
            d="M14.33 4.39a.74.74 0 0 1-.35 1l-2.67 1.23a.74.74 0 0 1-1-.36.74.74 0 0 1 .35-1L13.35 4a.74.74 0 0 1 .98.39z"
            class="eui-v2-icon--loader__2"
        ></path>
        <path
            d="M14.94 8.61a.74.74 0 0 1-.83.63l-2.91-.41a.74.74 0 0 1-.63-.83.73.73 0 0 1 .83-.63l2.92.41a.73.73 0 0 1 .62.83z"
            class="eui-v2-icon--loader__3"
        ></path>
        <path
            d="M13.18 12.49a.74.74 0 0 1-1 .07l-2.27-1.93a.75.75 0 0 1-.07-1 .73.73 0 0 1 1-.07l2.22 1.93a.74.74 0 0 1 .12 1z"
            class="eui-v2-icon--loader__4"
        ></path>
        <path
            d="M9.59 14.79a.74.74 0 0 1-.91-.51l-.81-2.83a.73.73 0 0 1 .5-.91.74.74 0 0 1 .91.51l.81 2.83a.74.74 0 0 1-.5.91z"
            class="eui-v2-icon--loader__5"
        ></path>
        <path
            d="M5.36 14.79a.74.74 0 0 1-.5-.91l.81-2.83a.74.74 0 0 1 .91-.51.74.74 0 0 1 .51.91l-.82 2.83a.74.74 0 0 1-.91.51z"
            class="eui-v2-icon--loader__6"
        ></path>
        <path
            d="M1.78 12.49a.73.73 0 0 1 .07-1l2.22-1.97a.73.73 0 0 1 1 .07.74.74 0 0 1-.07 1l-2.19 1.97a.73.73 0 0 1-1.03-.07z"
            class="eui-v2-icon--loader__7"
        ></path>
        <path
            d="M0 8.61a.73.73 0 0 1 .62-.83l2.92-.41a.73.73 0 0 1 .84.63.73.73 0 0 1-.63.83l-2.91.41A.74.74 0 0 1 0 8.61z"
            class="eui-v2-icon--loader__8"
        ></path>
        <path
            d="M.62 4.39A.74.74 0 0 1 1.6 4l2.67 1.28a.73.73 0 0 1 .35 1 .74.74 0 0 1-1 .36L1 5.37a.74.74 0 0 1-.38-.98z"
            class="eui-v2-icon--loader__9"
        ></path>
        <path
            d="M3.39 1.2a.74.74 0 0 1 1 .22L6 3.89a.74.74 0 0 1-.22 1 .73.73 0 0 1-1-.22L3.17 2.22a.74.74 0 0 1 .22-1.02z"
            class="eui-v2-icon--loader__10"
        ></path>
    </svg>
</template>

<script>
export default {};
</script>

<style lang="less">
@keyframes v2-loader-animate {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

.eui-v2-icon--loader__animate(@delay) {
    animation-name: v2-loader-animate;
    animation-iteration-count: infinite;
    animation-delay: @delay;
    animation-duration: 0.9s;
}

.eui-v2-icon--loader {
    &__0 {
        .eui-v2-icon--loader__animate(-0.8181818181818182s);
    }

    &__1 {
        .eui-v2-icon--loader__animate(-0.7363636363636363s);
    }

    &__2 {
        .eui-v2-icon--loader__animate(-0.6545454545454545s);
    }

    &__3 {
        .eui-v2-icon--loader__animate(-0.5727272727272728s);
    }

    &__4 {
        .eui-v2-icon--loader__animate(-0.49090909090909096s);
    }

    &__5 {
        .eui-v2-icon--loader__animate(-0.4090909090909091s);
    }

    &__6 {
        .eui-v2-icon--loader__animate(-0.32727272727272727s);
    }

    &__7 {
        .eui-v2-icon--loader__animate(-0.24545454545454548s);
    }

    &__8 {
        .eui-v2-icon--loader__animate(-0.16363636363636364s);
    }

    &__9 {
        .eui-v2-icon--loader__animate(-0.08181818181818182s);
    }

    &__10 {
        .eui-v2-icon--loader__animate(0s);
    }
}
</style>
