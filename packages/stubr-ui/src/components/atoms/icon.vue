<template>
    <div
        ref="iconWrapper"
        @click="isClickAvailable ? $emit('click', $event) : () => {}"
        :class="['icon', color, { link: clickable }, { disabled: isDisabled }]"
        v-html="icons[name]"
        :style="{ width: width, height: height }"
    ></div>
</template>

<script lang="ts">
import Vue from 'vue'
const EyeIcon = require('@/assets/svg/eye-icon.svg') as string
const CheckmarkIcon = require('@/assets/svg/checkmark-icon.svg') as string

export default Vue.extend({
    props: {
        name: {
            type: String,
            required: true
        },
        width: {
            type: String,
            default: '20px'
        },
        height: {
            type: String,
            default: '20px'
        },
        color: {
            type: String,
            default: ''
        },
        clickable: {
            type: Boolean as () => boolean
        },
        isDisabled: {
            type: Boolean as () => boolean
        }
    },
    data() {
        return {
            icons: {
                eye: EyeIcon,
                checkmark: CheckmarkIcon
            }
        }
    },
    computed: {
        isClickAvailable(): boolean {
            return this.clickable && !this.isDisabled
        }
    }
})
</script>

<style lang="scss">
@import '@/scss/main';

.icon {
    display: block;

    svg {
        height: 100%;
        width: 100%;
    }

    &.link {
        transform-style: preserve-3d;
        cursor: pointer;
        position: relative;

        &:before {
            transition: all 0.2s;
            transform: translateZ(-1px);
            border-radius: 100%;
            position: absolute;
            background: rgba(130, 130, 130, 0.1);
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            opacity: 0;
            content: '';
        }

        &:hover {
            &:before {
                opacity: 1;
                width: 140%;
                height: 140%;
                top: -20%;
                left: -20%;
            }
        }
    }

    &.disabled {
        opacity: 0.5;
        cursor: default;
        pointer-events: none;
    }

    &.blue {
        svg {
            stroke: $c-blue;
            fill: $c-blue;

            polygon,
            circle,
            g,
            rect {
                fill: $c-blue;

                use,
                path {
                    fill: $c-blue;
                }
            }
        }
    }

    &.green {
        svg {
            stroke: $c-green;
            fill: $c-green;

            polygon,
            circle,
            g,
            rect {
                fill: $c-green;

                use,
                path {
                    fill: $c-green;
                }
            }
        }
    }

    &.red {
        svg {
            stroke: $c-red;
            fill: $c-red;

            polygon,
            circle,
            g,
            rect {
                fill: $c-red;

                use,
                path {
                    fill: $c-red;
                }
            }
        }
    }

    &.purple {
        svg {
            stroke: $c-purple;
            fill: $c-purple;

            polygon,
            circle,
            g,
            rect {
                fill: $c-purple;

                use,
                path {
                    fill: $c-purple;
                }
            }
        }
    }

    &.inactive {
        svg {
            stroke: $c-reduced-presence-level-1;
            fill: $c-reduced-presence-level-1;

            polygon,
            circle,
            g,
            rect {
                fill: $c-reduced-presence-level-1;

                use,
                path {
                    fill: $c-reduced-presence-level-1;
                }
            }
        }
    }
}
</style>
