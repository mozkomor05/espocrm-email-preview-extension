define('email-combined-view:views/email/record/combined-cell', ['views/base'], function (Dep) {
    return Dep.extend({
        template: 'email-combined-view:email/record/combined-cell',

        data: function () {
            return {
                isRead: this.model.get('isRead'),
            };
        },

        setup: function () {
            Dep.prototype.setup.call(this);

            this.createView('dateSent', 'views/fields/datetime-short', {
                mode: 'list',
                name: 'dateSent',
                el: this.options.el + ' .date-container',
                model: this.model,
            }, view => view.render());

            this.createView('personStringData', 'views/email/fields/person-string-data', {
                mode: 'list',
                name: 'personStringData',
                el: this.options.el + ' .person-string-data-container',
                model: this.model,
            }, view => view.render());

            this.createView('subject', 'views/email/fields/subject', {
                name: 'subject',
                el: this.options.el + ' .subject-container',
                model: this.model,
                mode: 'listLink',
            }, view => view.render());
        }
    });
});
