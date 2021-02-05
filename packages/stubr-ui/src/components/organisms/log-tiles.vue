<template>
    <div class="log-tiles">
        <v-log-tile
            v-for="logEntry in logEntries"
            :key="logEntry.id"
            :log-entry="logEntry"
        ></v-log-tile>
        <div v-if="!logEntries || logEntries.length == 0" class="placeholder">
            (no entries available, yet)
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

import LogTile from './log-tile.vue'

export default Vue.extend({
    computed: {
        ...mapGetters(['logEntries'])
    },
    components: {
        vLogTile: LogTile
    }
})
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.log-tiles {
    width: 100%;

    .log-tile {
        margin-bottom: 20px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .placeholder {
        padding: 20px 0;
        text-align: center;
        color: $c-reduced-presence-level-1;
    }
}
</style>
