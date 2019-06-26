<template>
    <div 
        :class="['tag', color, type, active ? 'active' : '', clickable ? 'clickable' : '']"
        @click="$emit('click')">
        <slot></slot>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';

    export default Vue.extend({
        props: {
            color: {
                type: String
            },
            type: {
                type: String
            },
            clickable: {
                type: Boolean
            },
            active: {
                type: Boolean
            }
        }
    });
</script>

<style lang="scss" scoped>
    @import "../../01_scss/main.scss";

    .tag { 
        display: inline-block;
        border-radius: 6px;
        padding: 4px 9px;
        font-size: 12px;
        background: #f5f5f5;
        font-weight: 500;
        pointer-events: none;
        transition: all 0.2s;
        letter-spacing: 0.5px;

        &.clickable {
            pointer-events: auto;
            cursor: pointer;
        }

        &.green {
            color: $c-green;
            background: lighten($c-green, 40%);

            &:hover {
                background: lighten($c-green, 35%);
            }

            &.active {
                color: #fff;
                background: $c-green;
                box-shadow: 0 1px 7px 0 rgba(41, 208, 133, 0.4);

                &:hover {
                    background: lighten($c-green, 5%);
                }
            }
        }

        &.blue {
            color: $c-blue;
            background: lighten($c-blue, 35%);

            &:hover {
                background: lighten($c-blue, 30%);
            }

            &.active {
                color: #fff;
                background: $c-blue;
                box-shadow: 0 1px 7px 0 rgba(43, 129, 254, 0.4);

                &:hover {
                    background: lighten($c-blue, 5%);
                }
            }
        }

        &.red {
            color: $c-red;
            background: lighten($c-red, 45%);

            &:hover {
                background: lighten($c-red, 40%);
            }

            &.active {
                color: #fff;
                background: $c-red;
                box-shadow: 0 1px 7px 0 #DD151566;

                &:hover {
                    background: lighten($c-red, 5%);
                }
            }
        }

        &.orange {
            color: $c-orange;
            background: lighten($c-orange, 45%);

            &:hover {
                background: lighten($c-orange, 40%);
            }

            &.active {
                color: #fff;
                background: $c-orange;
                box-shadow: 0 1px 7px 0 #FF920066;

                &:hover {
                    background: lighten($c-orange, 5%);
                }
            }
        }
    }
</style>
