define(['views/email/record/list', 'email-combined-view:helpers/version'], function (Dep, VersionHelper) {
    return Dep.extend({

        listLayout: [{
            name: 'combinedCell',
            view: 'email-combined-view:views/email/record/combined-cell',
            notSortable: true,
            customLabel: ''
        }],

        selectAttributes: ['takenStatus'],

        rowActionsDisabled: true,

        lastOpenId: null,

        /**
         * @type {module:email-combined-view:helpers/version.Class}
         */
        versionHelper: null,

        setup: function () {
            this.setupEvents();

            Dep.prototype.setup.call(this);

            this.versionHelper = new VersionHelper(this.getMetadata(), this.getConfig());

            this.lastOpenId = null;

            this.on('remove', () => this.getParentView().clearView('combinedDetail'));

            this.on('after:show-more', () => {
                this.colorRows();
            });
        },

        setupEvents: function () {
            this.events['click td.cell[data-name="combinedCell"]'] = e => {
                /* Prevents this event from firing when clicking on hover actions */
                const directTarget = $(e.target);

                if ([directTarget, directTarget.parent()]
                    .some($el => $el.hasClass('hover-actions'))) {
                    return;
                }

                e.preventDefault();
                const parent = $(e.currentTarget).parent();
                const id = parent.attr('data-id');

                if (!id) {
                    return;
                }

                const lastOpenId = this.lastOpenId;
                this.lastOpenId = id;

                if (lastOpenId !== id) {
                    const $target = $('.record-checkbox[data-id="' + lastOpenId + '"]');

                    if ($target.length) {
                        $target.closest('tr').removeClass('selected');
                    }
                }

                $(e.currentTarget).closest('tr').addClass('selected');

                this.actionQuickView({id: id});
            };

            delete this.events['click a.link'];
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            if (!this.collection.length) {
                this.getParentView().clearView('combinedDetail');
                return;
            }

            this.loadHoverActions();
            this.colorRows();

            const emailId = this.lastOpenId || this.collection.selectedEmailId;

            if (!emailId) {
                this.switchTo(0);
                return;
            }

            this.switchOrLoad(emailId);
        },

        switchOrLoad: function (id) {
            if (this.collection.has(id)) {
                this.switchToId(id);
            } else {
                this.actionQuickView({id: id});
            }
        },

        colorRows: function () {
            this.collection.models.forEach(model => {
                const status = model.get('takenStatus');
                const style = this.getMetadata().get(['entityDefs', 'Email', 'fields', 'takenStatus', 'style', status]);

                if (!_.isString(style)) {
                    return;
                }

                const color = window
                    .getComputedStyle(document.documentElement)
                    .getPropertyValue(`--btn-${style}-bg`);

                if (color) {
                    this.colorRow(model.id, color);
                }
            });
        },

        colorRow: function (id, color) {
            this.$el.find(`tr.list-row[data-id="${id}"]`).css('background-color', color + '99');
        },

        getSelectAttributeList: function (callback) {
            if (this.selectAttributes) {
                callback(this.selectAttributes);

                return;
            }

            this.getHelper().layoutManager.get('Email', 'list', listLayout => {
                const originalListLayout = this.listLayout;

                this.listLayout = listLayout;
                callback(this.fetchAttributeListFromLayout());

                this.listLayout = originalListLayout;
            });
        },

        removeRecordFromList: function (id) {
            const index = this.collection.findIndex(model => model.id === id);

            Dep.prototype.removeRecordFromList.call(this, id);

            if (this.lastOpenId !== id) {
                return;
            }

            this.lastOpenId = null;
            this.switchTo(index);
        },

        /**
         * Tries to fetch the model, if it's not in the collection
         *
         * @return {Promise<module:model.Class>}
         * */
        getModel: function (id) {
            if (this.collection.has(id)) {
                return new Promise(resolve => resolve(this.collection.get(id)));
            }

            return new Promise(resolve => {
                this.getModelFactory()
                    .create('Email', model => model.id = id)
                    .then(model => model.fetch().then(
                        () => resolve(model)
                    ));
            });
        },

        actionQuickView: function (data) {
            const parentView = this.getParentView();

            this.getModel(data.id).then(model => {
                if (parentView.hasView('combinedDetail') && parentView.getView('combinedDetail').model.id === data.id) {
                    return;
                }

                const viewName = this.getMetadata().get(['clientDefs', 'Email', 'recordViews', 'detailCombined']) || 'email-combined-view:views/email/record/combined-detail';

                const options = {
                    model: model,
                    el: this.getParentView().getSelector() + ' .detail-container',
                };

                this.notify('Loading...');

                parentView.createView('combinedDetail', viewName, options, view => {
                    model.fetch();

                    this.listenToOnce(view, 'after:render', () => {
                        this.notify(false);
                    });

                    this.listenToOnce(view, 'after:save', model =>
                        this.trigger('after:save', model)
                    );

                    this.listenTo(model, 'after:save', () =>
                        this.collection.fetch()
                    );

                    this.listenTo(view, 'switch-neighbor', data =>
                        this.switchNeighbor(model, data.direction)
                    );

                    this.listenTo(view, 'delete', () => {
                        this.removeRecordFromList(model.id);
                    });

                    this.listenTo(view, 'clicked-reply', id => {
                        this.switchOrLoad(id);
                    });

                    this.trigger('select', model);

                    view.render();
                });
            });
        },

        switchNeighbor: function (model, direction = 1) {
            const index = this.collection.indexOf(model) + direction;

            this.switchTo(index);
        },

        switchTo: function (index) {
            const newIndex = Math.min(this.collection.length - 1, Math.max(0, index));
            const neighbourId = this.collection.at(newIndex).id;

            this.switchToId(neighbourId);
        },

        switchToId: function (id) {
            this.$el.find('.list-row[data-id="' + id + '"] > .cell[data-name="combinedCell"]').trigger('click');
        },

        /**
         * Loads the hover actions for every model in view's collection.
         * Creates hover action elements and appends them to the combined cell element of each row.
         * @returns {void}
         * @throws {Error} If the row or combined cell element is not found.
         *
         * @see createHoverActions()
         */
        loadHoverActions: function () {
            for (const model of this.collection.models) {
                const $row = this.$el.find(`tr.list-row[data-id="${model.id}"]`);

                if (!$row.length) {
                    throw new Error('Row not found');
                }

                const $hoverActions = $('<td class="hover-actions"></td>');
                const $container = $('<div class="container"></div>');

                $container.append(...this.createHoverActions(model));
                $hoverActions.append($container);
                $row.append($hoverActions);
            }
        },

        computeBackgroundColor: function ($el) {
            if (!this._defaultBackground) {
                this._defaultBackground = $('<div/>').css('background-color');
            }

            const backgroundColor = $el.css('background-color');

            if (backgroundColor === this._defaultBackground) {
                if (!$el.parent().length) {
                    return backgroundColor;
                }

                return $el.parent().css('background-color');
            }

            return backgroundColor;
        },

        /** Class representing a hover action. */
        HoverAction: class {
            /**
             * Creates a new instance of HoverAction.
             *
             * Creates the jquery element, applies default active value,
             * creates event listener that will execute the provided action.
             *
             * @param {string} className element's custom css class name
             * @param {string} faIcon element's font awesome icon class name
             * @param {boolean} active whether the hover action is active or not at the start
             * @param {() => boolean} action the action to be executed on click, should return true or false
             * whether the hover action state should be active or not after the action is executed
             */
            constructor(className, faIcon, active, action) {
                this.className = className;
                this.faIcon = faIcon;
                this.active = active;
                this.action = action;

                this.$el = this.createElement();
                this.setActive(active);
                this.event();
            }

            /**
             * Returns the element of this hover action.
             *
             * @returns {jQuery|*} jquery element
             * @throws {Error} if the element is not created yet
             */
            element() {
                if (!this.$el) throw new Error('Element used before creation');
                return this.$el;
            }

            /**
             * Creates "onclick" event listener for this hover action element,
             * which will execute the provided action and set the
             * hover action to active or inactive based on the result.
             */
            event() {
                this.element().on('click', () => {
                    this.setActive(this.action());
                });
            }

            /**
             * Sets the hover action state to active or inactive.
             * And then adds or removes the "active" class to the element, respectively.
             *
             * @param {boolean} active
             */
            setActive(active) {
                this.element().toggleClass('active', active);
            }

            /**
             * Creates and returns the jquery element for this hover action.
             * @returns {jQuery|*}
             */
            createElement() {
                return $(`<i class="fas ${this.faIcon} ${this.className}"></i>`);
            }
        },

        /**
         * Creates hover actions for a model
         * @param model to which model the hover actions should be applied
         * @returns {jQuery[]|*[]} array of jquery elements corresponding to the created hover actions
         *
         * @see HoverAction
         */
        createHoverActions: function (model) {
            return [
                new this.HoverAction('trash', 'fa-trash', model.get('inTrash'), () => {
                    const inTrash = model.get('inTrash');

                    if (inTrash) {
                        this.actionRetrieveFromTrash({id: model.id});
                    } else {
                        this.actionMoveToTrash({id: model.id});
                    }

                    return !inTrash;
                }), new this.HoverAction('read', 'fa-check', model.get('isRead'), () => {
                    const isRead = model.get('isRead');

                    this.actionMarkAsRead(model.id, !isRead);

                    return !isRead;
                }), new this.HoverAction('important', 'fa-star', model.get('isImportant'), () => {
                    const isImportant = model.get('isImportant');

                    if (isImportant) this.actionMarkAsNotImportant({id: model.id}); else this.actionMarkAsImportant({id: model.id});

                    return !isImportant;
                }),
            ].map(hoverAction => hoverAction.element());
        },

        /**
         * Mark an email as read or unread
         *
         * (EspoCRM does not have a built-in method to mark
         * a single email message as read/unread, so we have
         * to create our own.)
         *
         * @param {string} id The id of the email
         * @param {boolean} read Set the email as read or unread
         * @returns {void}
         */
        actionMarkAsRead: function (id, read) {
            let promise;

            if (this.versionHelper.isLess('7.4.0')) {
                promise = Espo.Ajax.postRequest(`Email/action/markAs${(read) ? '' : 'Not'}Read`, {ids: [id]});
            } else {
                if (read) {
                    promise = Espo.Ajax.postRequest(`Email/inbox/read`, {ids: [id]});
                } else {
                    promise = Espo.Ajax.deleteRequest(`Email/inbox/read`, {ids: [id]});
                }
            }

            const model = this.collection.get(id);

            if (model) {
                promise.then(() => model.set('isRead', read));
            }
        }

    });
});
