/**
 * FontAwesome-Picker
 * Browser action script
 */

// CSS
require('./css/style.scss');

// Dependencies
import Vue from 'vue';
import IconsPicker from 'vue-icons-picker';

// Init VueJs component
new Vue({
    el: '#app',
    render: h => h(IconsPicker, {
        props: {
            config: {
                name: 'FontAwesome',
                classPrefix: 'fa',
                repoUrl: 'https://github.com/chteuchteu/FontAwesome-Picker',

                icons: {
                    main: 'fa fa-flag',
                    loading: 'mdi mdi-spinner',
                    close: 'fa fa-times',
                    openExternal: 'fa fa-external-link',
                    random: 'fa fa-random',
                    randomColors: 'fa fa-tint',
                    madeBy: 'fa fa-heart',
                    gitHub: 'fa fa-github'
                },

                openText: 'Open FontAwesome.io',
                openUrl: 'http://fontawesome.io',
                openIconText: 'Open {icon} in FontAwesome.io',
                openIconUrl: 'http://fontawesome.io/icon/{icon}/',

                canCopySvg: false,
            }
        }
    })
});
