define('email-combined-view:views/email/list', ['views/email/list'], function (Dep) {
    return Dep.extend({

        template: 'email-combined-view:email/list',

        searchView: 'email-combined-view:views/email/record/search',

        MODE_COMBINED: 'combined',

        selectedEmailId: null,

        skipBuildRows: true,

        setup: function () {
            Dep.prototype.setup.call(this);

            this.selectedEmailId = (this.options.params || {}).email;

            this.applyEmail();

            this.on('remove', () => this.removeStickableEmails());
        },

        data: function () {
            const data = Dep.prototype.data.call(this);
            data.isCombinedMode = this.viewMode === this.MODE_COMBINED;

            return data;
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            // Backwards compatibility
            if ('initStickableFolders' in this) {
                this.initStickableFolders();
            }

            if (this.viewMode === this.MODE_COMBINED) {
                this.initStickableEmails();
            } else {
                this.removeStickableEmails();
            }
        },

        initStickableEmails: function () {
            const $window = $(window);
            const $container = this.$el.find('.email-list-container');
            const $list = $container.parent();

            const screenWidthXs = this.getThemeManager().getParam('screenWidthXs');
            const isSmallScreen = $(window.document).width() < screenWidthXs;
            const offset = this.getThemeManager().getParam('navbarHeight') + (this.getThemeManager().getParam('buttonsContainerHeight') || 47);

            const bottomSpaceHeight = parseInt(window.getComputedStyle($('#content').get(0)).paddingBottom, 10);

            const getOffsetTop = (/** JQuery */$element) => {
                let element = $element.get(0);

                let value = 0;

                while (element) {
                    value += !isNaN(element.offsetTop) ? element.offsetTop : 0;

                    element = element.offsetParent;
                }

                if (isSmallScreen) {
                    return value;
                }

                return value - offset;
            };

            this.stickableTop = getOffsetTop($list);

            const control = () => {
                let start = this.stickableTop;

                if (start === null) {
                    start = this.stickableTop = getOffsetTop($list);
                }

                let scrollTop = $window.scrollTop();

                if (scrollTop <= start || isSmallScreen) {
                    $container
                        .removeClass('sticked')
                        .width('')
                        .scrollTop(0);

                    $container.css({
                        maxHeight: '',
                    });

                    return;
                }

                if (scrollTop > start) {
                    let scroll = $window.scrollTop() - start;

                    $container
                        .width($container.outerWidth(true))
                        .addClass('sticked')
                        .scrollTop(scroll);

                    let topStickPosition = parseInt(window.getComputedStyle($container.get(0)).top);

                    let maxHeight = $window.height() - topStickPosition - bottomSpaceHeight;

                    $container.css({maxHeight: maxHeight});
                }
            };

            $window.on('resize.combined-view-list', () => control());
            $window.on('scroll.combined-view-list', () => control());
        },

        removeStickableEmails: function () {
            $(window).off('resize.combined-view-list');
            $(window).off('scroll.combined-view-list');
        },

        switchViewMode: function (mode) {
            this.clearView('list');
            this.setViewMode(mode, true);

            this.skipBuildRows = false;
            this.reRender();
            this.skipBuildRows = true;
        },

        prepareRecordViewOptions: function (o) {
            o.skipBuildRows = this.skipBuildRows;
            o.el += ' .email-list-container';
        },

        createListRecordView: function (fetch) {
            return Dep.prototype.createListRecordView.call(this, fetch)
                .then(view => {
                    view = this.getRecordView();

                    this.listenTo(view, 'select', model => {
                        this.selectedEmailId = model.id;

                        const params = {
                            folder: this.getSelectedFolderId(),
                            email: this.selectedEmailId,
                        };

                        this.applyEmail();

                        this.applyParamsToUrl(params);
                    });
                });
        },

        getSelectedFolderId: function () {
            return this.selectedFolderId !== this.defaultFolderId ? this.selectedFolderId : null;
        },

        createView: function (key, viewName, options, callback, wait) {
            return Dep.prototype.createView.call(this, key, viewName, options, view => {
                if (typeof callback === 'function') {
                    callback(view);
                }

                if (key === 'folders') {
                    this.stopListening(view, 'select');

                    let xhr = null;

                    this.listenTo(view, 'select', folderId => {
                        this.selectedFolderId = folderId;
                        this.applyFolder();

                        if (xhr && xhr.readyState < 4) {
                            xhr.abort();
                        }

                        Espo.Ui.notify(' ... ');

                        xhr = this.collection
                            .fetch()
                            .then(() => Espo.Ui.notify(false));

                        const params = {
                            folder: this.getSelectedFolderId(),
                            email: this.selectedEmailId,
                        };

                        this.applyParamsToUrl(params);
                        this.updateLastUrl();
                    });
                }
            }, wait);
        },

        applyEmail: function () {
            this.collection.selectedEmailId = this.selectedEmailId;
        },

        applyRoutingParams: function (params) {
            Dep.prototype.applyRoutingParams.call(this, params);

            if (email in params) {
                this.getRecordView().lastOpenId = params.email;
            }
        },

        applyParamsToUrl: function (params) {
            const paramsCloned = _.clone(params);

            _.each(paramsCloned, (value, key) => {
                if (_.isNull(value) || _.isUndefined(value)) {
                    delete paramsCloned[key];
                }
            });

            this.getRouter().navigate('#Email/list/' + $.param(paramsCloned), {
                replace: true,
            });
        },

    });
});
