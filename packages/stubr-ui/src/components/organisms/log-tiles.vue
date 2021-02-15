<template>
    <div class="log-tiles">
        <v-log-tile
            v-for="logEntry in logEntries"
            :key="logEntry.id"
            :log-entry="logEntry"
        ></v-log-tile>
        <div v-if="!logEntries || logEntries.length == 0" class="placeholder">
            waiting for the first event ...
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';

import LogTile from './log-tile.vue';

export default Vue.extend({
    computed: {
        ...mapGetters(['logEntries'])
    },
    components: {
        vLogTile: LogTile
    }
});
</script>

<style lang="scss" scoped>
@import '@/scss/main';

.log-tiles {
    width: 100%;
    margin-bottom: 30px;

    .log-tile {
        margin-bottom: 20px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .placeholder {
        font-size: 17px;
        letter-spacing: 0.2px;
        padding: 80px 0;
        text-align: center;
        color: #b4bdd9;
    }
}
</style>
