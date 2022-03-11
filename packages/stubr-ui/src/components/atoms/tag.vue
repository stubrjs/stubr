<template>
    <div
        :class="[
            'tag',
            color,
            type,
            active ? 'active' : '',
            clickable ? 'clickable' : '',
        ]"
        @click="$emit('click')"
    >
        <slot></slot>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
    props: {
        color: {
            type: String,
        },
        type: {
            type: String,
        },
        clickable: {
            type: Boolean,
        },
        active: {
            type: Boolean,
        },
    },
});
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.tag {
    display: inline-block;
    border-radius: 6px;
    padding: 6px 15px;
    font-size: 12px;
    color: #333;
    background: #fff;
    font-weight: 500;
    pointer-events: none;
    transition: all 0.2s;
    letter-spacing: 0.5px;

    &:hover {
        box-shadow: $l-tag-box-shadow-hover;
    }

    &.active {
        color: #fff;
        background: #444;
        box-shadow: 0 1px 7px 0 rgba(50, 50, 50, 0.5);

        &:hover {
            background: lighten(#444, 7%);
        }
    }

    &.clickable {
        box-shadow: $l-tag-box-shadow;
        pointer-events: auto;
        cursor: pointer;
    }

    &.green {
        color: $c-green;
        background: #fff;

        &.active {
            color: #fff;
            background: $c-green;
            box-shadow: 0 1px 7px 0 rgba(9, 232, 139, 0.5);

            &:hover {
                background: lighten($c-green, 7%);
            }
        }
    }

    &.blue {
        color: $c-blue;
        background: #fff;

        &.active {
            color: #fff;
            background: $c-blue;
            box-shadow: 0 1px 7px 0 rgba(23, 77, 255, 0.5);

            &:hover {
                background: lighten($c-blue, 7%);
            }
        }
    }

    &.red {
        color: $c-red;
        background: #fff;

        &.active {
            color: #fff;
            background: $c-red;
            box-shadow: 0 1px 7px 0 rgba(255, 18, 10, 0.5);

            &:hover {
                background: lighten($c-red, 7%);
            }
        }
    }

    &.orange {
        color: $c-orange;
        background: #fff;

        &.active {
            color: #fff;
            background: $c-orange;
            box-shadow: 0 1px 7px 0 rgba(255, 104, 10, 0.5);

            &:hover {
                background: lighten($c-orange, 7%);
            }
        }
    }

    &.purple {
        color: $c-purple;
        background: #fff;

        &.active {
            color: #fff;
            background: $c-purple;
            box-shadow: 0 1px 7px 0 rgba(161, 9, 232, 0.5);

            &:hover {
                background: lighten($c-purple, 7%);
            }
        }
    }

    &.yellow {
        color: $c-yellow;
        background: #fff;

        &.active {
            color: #fff;
            background: $c-yellow;
            box-shadow: 0 1px 7px 0 rgba(255, 232, 1, 0.5);

            &:hover {
                background: lighten($c-yellow, 7%);
            }
        }
    }
}
</style>
