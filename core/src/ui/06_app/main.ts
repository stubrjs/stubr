import Vue from 'vue';

// @ts-ignore
import entry from './entry.vue';

// global state
import store from '../04_vuex/store';

new Vue({
	el: '#stubr-ui',
	store: store,
	template: `<v-entry></v-entry>`,
	components: {
		vEntry: entry
	}
});
