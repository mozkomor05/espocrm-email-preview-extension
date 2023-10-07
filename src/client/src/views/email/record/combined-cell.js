define(['view'], Dep => {
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
                selector: '.date-container',
                model: this.model,
            });

            this.createView(
                'personStringData',
                'views/email/fields/person-string-data',
                {
                    mode: 'list',
                    name: 'personStringData',
                    selector: '.person-string-data-container',
                    model: this.model,
                }
            );

            this.createView('subject', 'views/email/fields/subject', {
                name: 'subject',
                selector: '.subject-container',
                model: this.model,
                mode: 'listLink',
            });
        }
    });
});
