<template>
    <div :class="{ 'formatted-payload': true, revealed: revealed }">
        <div class="head">
            <v-icon
                name="eye"
                :color="contextSensitiveIconColor"
                :clickable="true"
                @click="handleRevealClick"
            />
            <span class="title">{{ title }}</span>
            <span :class="['status-code', statusCodeColorClass]">{{
                statusCode
            }}</span>
        </div>
        <div class="expandable">
            <div class="payload-section">Headers</div>
            <button
                v-if="false"
                class="copy-btn"
                :data-clipboard-text="JSON.stringify(headers)"
            >
                Copy
            </button>
            <pre class="code">{{ headers }}</pre>

            <div v-if="hasParams" class="payload-section">Params</div>
            <pre v-if="hasParams" class="code">{{ params }}</pre>

            <div class="payload-section">Body</div>
            <pre v-if="!hasSentFile" class="code">{{ body }}</pre>
            <pre v-if="hasSentFile" class="code">[FILE PAYLOAD]</pre>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Icon from '../atoms/icon.vue';
import Clipboard from 'clipboard';
import { isEmpty } from 'lodash';

export default Vue.extend({
    props: {
        title: {
            type: String
        },
        headers: {
            type: Object
        },
        params: {
            type: Object
        },
        hasSentFile: {
            type: Boolean
        },
        body: {
            type: Object
        },
        statusCode: {
            type: Number
        },
        iconColor: {
            type: String
        }
    },
    data() {
        return {
            revealed: false
        };
    },
    computed: {
        contextSensitiveIconColor(): string {
            return this.revealed ? this.iconColor : 'inactive';
        },
        statusCodeColorClass(): string | null {
            if (this.statusCode >= 400) {
                return 'error';
            } else if (this.statusCode >= 300) {
                return 'not-changed';
            } else if (this.statusCode >= 200) {
                return 'success';
            } else {
                return null;
            }
        },
        hasParams(): boolean {
            return this.params && !isEmpty(this.params);
        }
    },
    methods: {
        handleRevealClick(): void {
            this.revealed = !this.revealed;
        }
    },
    mounted() {
        new Clipboard('.copy-btn');
    },
    components: {
        vIcon: Icon
    }
});
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.formatted-payload {
    background: $c-reduced-presence-level-2;
    border-radius: 5px;
    padding: 10px 10px 0 10px;

    &.revealed {
        .expandable {
            display: block;
        }
    }

    .head {
        z-index: 1;
        display: flex;
        align-items: center;
        padding-bottom: 10px;

        .title {
            color: $c-reduced-presence-level-1;
            font-size: 13px;
            letter-spacing: 2px;
            text-transform: uppercase;
            padding-left: 20px;
        }

        .status-code {
            margin-left: 20px;
            font-size: 14px;
            font-weight: 500;

            &.error {
                color: $c-error;
            }

            &.success {
                color: $c-success;
            }

            &.not-changed {
                color: $c-yellow;
            }
        }
    }

    .expandable {
        display: none;
        padding-top: 30px;
        padding-left: 40px;
        padding-bottom: 10px;
        max-height: 300px;
        overflow-y: scroll;

        .payload-section {
            color: $c-reduced-presence-level-1;
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 10px;
            margin-top: 30px;

            &:first-child {
                margin-top: 0;
            }
        }

        .code {
            font-family: 'Roboto Mono', monospace;
            margin: 0;
            font-size: 13px;
            line-height: 1.3;
            letter-spacing: 1.3;
        }
    }
}
</style>
