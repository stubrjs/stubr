<template>
    <div class="log-tiles">
        <v-hidden-entries-separator
            class="first-separator"
            v-if="hiddenLogEntriesMap['BEFORE_FIRST']"
            key="BEFORE_FIRST-sep"
            :noOfHiddenEntries="
                hiddenLogEntriesMap['BEFORE_FIRST'].noOfHiddenItems
            "
        ></v-hidden-entries-separator>
        <template v-for="logEntry in filteredLogEntries">
            <v-log-tile :key="logEntry.id" :log-entry="logEntry"></v-log-tile>
            <v-hidden-entries-separator
                v-if="hiddenLogEntriesMap[logEntry.id]"
                :key="logEntry.id + '-sep'"
                :noOfHiddenEntries="
                    hiddenLogEntriesMap[logEntry.id].noOfHiddenItems
                "
            ></v-hidden-entries-separator>
        </template>

        <div
            v-if="!filteredLogEntries || filteredLogEntries.length == 0"
            class="placeholder"
        >
            waiting for the first event ...
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';

import LogTile from './log-tile.vue';
import HiddenEntriesSeparator from '../molecules/hidden-entries-separator.vue';

export default Vue.extend({
    computed: {
        ...mapGetters(['filteredLogEntries', 'hiddenLogEntriesMap']),
    },
    components: {
        vLogTile: LogTile,
        vHiddenEntriesSeparator: HiddenEntriesSeparator,
    },
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

    .separator-line {
        margin-top: 30px;
        margin-bottom: 30px;

        &.first-separator {
            margin-top: 10px;
        }
    }
}
</style>
