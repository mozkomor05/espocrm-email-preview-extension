define('email-combined-view:views/email/record/combined-detail', ['views/email/record/detail-quick', 'views/email/detail'], function (Dep, Detail) {
    return Dep.extend({
        setup: function () {
            Dep.prototype.setup.call(this);

            this.addButton({
                name: 'reply',
                label: 'Reply',
                action: this.getPreferences().get('emailReplyToAllByDefault') ? 'replyToAll' : 'reply',
                style: 'danger'
            }, false);

            this.addButton({
                name: 'fullForm',
                label: 'Full Form',
            }, false);

            this.addDropdownItem(false, true);

            this.addDropdownItem({
                'label': 'Reply to All',
                'name': 'replyToAll',
            }, true);

            this.addDropdownItem({
                'label': 'Reply',
                'name': 'reply',
            }, true);
        },

        actionFullForm: function () {
            this.getRouter().dispatch('Email', 'view', {
                attributes: _.extend(this.fetch(), this.model.getClonedAttributes()),
                returnUrl: Backbone.history.fragment,
                model: this.model,
                id: this.model.id,
            });
            this.getRouter().navigate('#Email/view/' + this.model.id, {trigger: false});
        },

        actionReply: function (data, e, cc) {
            Detail.prototype.actionReply.call(this, data, e, cc);
        },

        actionReplyToAll: function (data, e) {
            Detail.prototype.actionReplyToAll.call(this, data, e);
        },

        actionPrevious: function () {
            this.trigger('switch-neighbor', {
                direction: -1,
            });
        },

        actionNext: function () {
            this.trigger('switch-neighbor', {
                direction: 1,
            });
        },
    });
});
