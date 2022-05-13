import Vue from 'vue'
import App from './app.vue'
import store from './store'

Vue.config.productionTip = false

new Vue({
    store,
    render: h => h(App)
}).$mount('#app')
