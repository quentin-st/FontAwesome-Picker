/**
 * FontAwesomePicker-Picker
 * Browser action script
 */

(function($, window) {
    const cols = 6;

    var FontAwesomePicker = function(options) {
        this.options = options;
    };

    FontAwesomePicker.prototype = {
        ui: {},
        defaults: {
            cdnUrl: 'https://maxcdn.bootstrapcdn.com/font-awesome/latest/css/font-awesome.min.css'
        },

        init: function() {
            this.settings = $.extend({}, this.defaults, this.options);

            this.ui = {
                body: $('body'),
                header: {
                    filter: $('#filter'),
                    filterClear: $('#filter-clear'),
                    version: $('#version')
                },
                content: $('.content'),
                icons: {
                    list: $('#icons-list'),
                    loading: $('#loading'),
                    icons: null
                },
                properties: {
                    wrap: $('.icon-properties-wrap'),
                    elem: $('#icon-properties'),
                    icon: $('#icon-icon'),
                    name: $('#icon-name'),
                    className: $('#icon-class').find('span'),
                    codepoint: $('#icon-codepoint'),
                    aliases: $('#icon-aliases')
                },
                footer: {
                    openInFontAwesome: $('#action-open-in-fontawesome'),
                    random: $('#action-random'),
                    randomColors: $('#action-random-colors'),
                    author: $('#action-author'),
                    github: $('#action-github')
                },
                colors: [
                    'red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green',
                    'light-green', 'lime', 'amber', 'orange', 'deep-orange', 'brown', 'grey', 'blue-grey'
                ]
            };

            this.prepareUI();
            this.fetchIcons();
        },

        prepareUI: function() {
            var self = this;

            // Filter keyup event
            var filterReplaceRegex = new RegExp('-', 'g');
            this.ui.header.filter.on('keyup', function() {
                var value = $(this).val().replace(filterReplaceRegex, ' ');

                if ($.trim(value).length == 0) {
                    self.ui.icons.icons.show();
                    self.ui.header.filterClear.addClass('hidden');
                    return;
                }
                self.ui.header.filterClear.removeClass('hidden');

                window.FontAwesomePicker.icons.forEach(function(icon) {
                    icon.domElem.toggle(
                        icon.searchable.indexOf(value) != -1
                    );
                });
            });
            this.ui.header.filterClear.click(function() {
                self.ui.header.filter
                    .val('')
                    .trigger('keyup');

                self.ui.header.filter.focus();
            });

            // Bind arrow keys
            $(document).keydown(function(e) {
                if (self.ui.header.filter.is(':focus')  // Filter has focus
                    || self.ui.icons.icons == null      // Icons not loaded yet
                    || e.which < 37 || e.which > 40)    // Not an arrow key
                    return;

                var iconWrap = self.ui.icons.icons.filter('.active'),
                    visibleIcons = self.ui.icons.icons.filter(':visible'),
                    rows = Math.ceil(visibleIcons.length/cols),
                    index = visibleIcons.index(iconWrap);

                // Nothing's selected
                if (index == -1)
                    return;

                var row = Math.floor(index/cols)+1,
                    col = (index % cols)+1;

                //var _row = row, _col = col;

                switch(e.which) {
                    case 37: // left
                        col--;
                        break;
                    case 38: // up
                        row--;
                        break;
                    case 39: // right
                        col++;
                        break;
                    case 40: // down
                        row++;
                        break;
                    default: return;
                }

                if (col == 0 && row != 1) {
                    col = cols;
                    row--;
                } else if (col == cols+1 && row != rows) {
                    col = 1;
                    row++;
                }

                if (row == 0 || row > rows
                    || col == 0 || col > cols)
                    return;

                //console.log('[' + _row + ', ' + _col + '] => [' + row + ', ' + col + ']');

                var newIndex = (row-1) * cols + col - 1,
                    newIcon = $(visibleIcons[newIndex]);

                if (!newIcon.length)
                    return;

                self.setActiveIcon(newIcon, true);

                e.preventDefault();
            });

            // Footer tooltips
            this.ui.footer.openInFontAwesome.tooltip({
                text: function() {
                    var activeIcon = self.ui.icons.icons.filter('.active');

                    if (!activeIcon.length)
                        return 'Open FontAwesome.io';
                    else
                        return 'Open ' + activeIcon.data('icon').name + ' in FontAwesome.io';
                }
            });
            this.ui.footer.random.tooltip({text: 'Random icon'});
            this.ui.footer.randomColors.tooltip({text: 'Random colors'});
            this.ui.footer.author.tooltip({text: 'Made with <3 by Quentin S.'});
            this.ui.footer.github.tooltip({text: 'GitHub'});

            // Footer actions
            this.ui.footer.random.click(function() {
                self.setActiveIcon(self.getRandomIcon(), true);
            });

            this.ui.footer.randomColors.click(function() {
                var randomColors = !$(this).is('.active');
                self.setRandomIconsColors(randomColors);
                localStorage.setItem('random-colors', randomColors);
            });

            // Restore "random colors" state
            this.setRandomIconsColors((localStorage.getItem('random-colors') || 'false') == 'true');

            this.iconsListInitialHeight = this.ui.icons.list.height();
        },

        setRandomIconsColors: function(state) {
            this.ui.body.toggleClass('random-icon-colors', state);
            this.ui.footer.randomColors.toggleClass('active', state);
        },

        fetchIcons: function() {
            var self = this;

            $.ajax({
                url: this.settings.cdnUrl,
                success: function(data) {
                    window.FontAwesomePicker = self.parseCSSFile(data);
                    self.ui.icons.loading.remove();

                    self.inflateUI();
                }
            });
        },

        parseCSSFile: function(cssFileContent) {
            var versionRegex = /Font Awesome ((?:\d+\.?)+)/,
                iconsRegex = /((?:\.fa-[a-z-\d]+:before,?)+){content:"\\(f[a-z\d]+)"}/g,
                selectorsRegex = /\.fa-([a-z-\d]+):before/g;

            // Find version number
            var version = versionRegex.exec(cssFileContent)[1];

            // Find icons
            var icons = [];

            var iconMatch,
                selectorsMatch,
                nameAliases = [],
                searchable = [],
                currentSelector = null;
            while (iconMatch = iconsRegex.exec(cssFileContent)) {
                var selectors = iconMatch[1];

                while (selectorsMatch = selectorsRegex.exec(selectors)) {
                    currentSelector = selectorsMatch[1];
                    nameAliases.push(currentSelector);
                    searchable.push(currentSelector);
                }

                // Remove main name (latest selector) from aliases
                nameAliases.pop();

                icons.push({
                    name: currentSelector,
                    aliases: nameAliases,
                    codepoint: iconMatch[2],
                    searchable: searchable.join(' ')
                });

                nameAliases = [];
                searchable = [];
                currentSelector = null;
            }

            // Sort icons alphabetically
            icons.sort(function(a, b) {
                if (a.name < b.name) {
                    return -1;
                }
                else if (a.name > b.name) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            return {
                version: version,
                icons: icons
            };
        },

        inflateUI: function() {
            var self = this;

            // Inflate icons list
            var iModel = document.createElement('i');
            iModel.classList.add('fa');

            var index = 0,
                icon;

            for (var y=0, l=window.FontAwesomePicker.icons.length; y<l; y++) {
                icon = window.FontAwesomePicker.icons[y];

                var i = iModel.cloneNode(false);
                i.classList.add('fa-' + icon.name);

                icon.domElem = $(i)
                    .data('icon', icon)
                    .appendTo(self.ui.icons.list);

                index++;
            }
            self.ui.icons.icons = self.ui.icons.list.children();
            this.ui.icons.list.click(function() {
                self.setActiveIcon(null);
            });
            self.ui.icons.list.on('click', '.fa', function(e) {
                self.setActiveIcon($(this));
                e.stopPropagation();
            });

            // Add tooltips
            self.ui.icons.icons.tooltip({
                text: function(icon) {
                    return icon.data('icon').name;
                }
            });

            this.ui.header.version.text('v' + window.FontAwesomePicker.version);

            this.ui.header.filter.focus();
        },

        getRandomIcon: function() {
            return $(this.ui.icons.icons.get(
                randomInt(0, this.ui.icons.icons.length-1)
            ));
        },

        setActiveIcon: function(iconElem, ensureVisible) {
            ensureVisible = ensureVisible || false;

            this.ui.icons.icons.filter('.active').removeClass('active');

            // We unselected current icon, let's finish here
            if (iconElem != null) {
                var iconMeta = iconElem.data('icon'),
                    className = iconMeta.name;
                iconElem.addClass('active');

                this.ui.properties.name.text(className);
                this.ui.properties.className.text('fa-' + className);
                this.ui.properties.icon[0].classList = 'fa fa-fw fa-' + className;
                this.ui.properties.codepoint.text(iconMeta.codepoint);
                this.ui.properties.aliases.text(iconMeta.aliases.join(', '));
                this.ui.footer.openInFontAwesome.attr('href', 'http://fontawesome.io/icon/' + className);

                if (ensureVisible) {
                    var offset = iconElem.offset().top - iconElem.parent().offset().top;
                    var iconElemHeight = iconElem.outerHeight(true);

                    var scrollTop = iconElem.parent().scrollTop(),
                        initialScrollTop = scrollTop;
                    if (offset - 5 < 0) {
                        scrollTop += offset - 5;
                    }
                    else if (offset + iconElemHeight > iconElem.parent().height()) {
                        scrollTop += offset + iconElemHeight - iconElem.parent().height();
                    }

                    if (scrollTop != initialScrollTop) {
                        iconElem.parent().scrollTop(scrollTop);
                    }
                }
            }

            // Update properties height
            var autoHeight = iconElem != null
                ? this.ui.properties.elem[0].scrollHeight
                : 0;
            this.ui.properties.wrap.css('height', autoHeight);
            this.ui.icons.list.css('height', this.iconsListInitialHeight-autoHeight);
        }
    };

    window.FontAwesomePicker = FontAwesomePicker;

    $(document).ready(function() {
        window.picker = new FontAwesomePicker();
        window.picker.init();
    });

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

})($, window);
