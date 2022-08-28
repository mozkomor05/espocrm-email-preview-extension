define('email-combined-view:views/email/record/combined', ['views/email/record/list'], function (Dep) {
    return Dep.extend({
        listLayout: [
            {
                "name": "combinedCell",
                "view": "email-combined-view:views/email/record/combined-cell",
                "notSortable": true,
                "customLabel": ""
            }
        ],
        selectAttributes: null,
        rowActionsDisabled: true,
        lastOpenId: null,

        events: _.extend({
            'click [data-name="combinedCell"]': function (e) {
                e.preventDefault();
                const parent = $(e.currentTarget).parent();
                const id = parent.attr('data-id');

                const lastOpenId = this.lastOpenId;
                this.lastOpenId = id;

                if (lastOpenId !== id) {
                    this.uncheckRecord(lastOpenId, null, true);
                }

                this.checkRecord(id, null, true);
                this.actionQuickView({id: id});
            }
        }, Dep.prototype.events),

        setup: function () {
            Dep.prototype.setup.call(this);

            delete this.events['click a.link'];
            this.lastOpenId = null;

            this.on('remove', () => {
                this.getParentView().clearView('combinedDetail');
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            if (this.collection.length) {
                if (this.collection.has(this.lastOpenId)) {
                    this.switchToId(this.lastOpenId);
                } else {
                    this.switchTo(0);
                }
            } else {
                this.getParentView().clearView('combinedDetail');
            }
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

        uncheckRecord: function (id, $target, isSilent) {
            if (id === this.lastOpenId) {
                return;
            }

            Dep.prototype.uncheckRecord.call(this, id, $target, isSilent);
        },

        removeRecordFromList: function (id) {
            const index = this.collection.findIndex(model => model.id === id);

            Dep.prototype.removeRecordFromList.call(this, id);

            this.lastOpenId = null;
            this.switchTo(index);
        },

        actionQuickView: function (data) {
            const parentView = this.getParentView();
            const model = this.collection.get(data.id);

            if (parentView.hasView('combinedDetail') && parentView.getView('combinedDetail').model.id === data.id) {
                return;
            }

            const viewName = this.getMetadata().get(['clientDefs', 'Email', 'recordViews', 'detailCombined']) || 'autocrm:views/email/record/combined-detail';
            const options = {
                model: model,
                el: this.getParentView().getSelector() + ' .detail-container',
            };

            this.notify('Loading...');
            parentView.createView('combinedDetail', viewName, options, view => {
                    model.fetch();

                    this.listenToOnce(view, 'after:render', () => {
                        this.notify(false);
                        setTimeout(() => model.set('isRead', true), 50);
                    });

                    this.listenToOnce(view, 'after:save', (model) => {
                        this.trigger('after:save', model);
                    });

                    this.listenTo(view, 'switch-neighbor', data => {
                        this.switchNeighbor(model, data.direction);
                    });

                    view.render();
                }
            );
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
        }
    });
});
