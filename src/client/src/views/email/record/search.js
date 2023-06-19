define('email-combined-view:views/email/record/search', ['views/record/search'], function (Dep) {
    return Dep.extend({

        setup: function () {
            this.viewModeIconClassMap.combined = 'fas fa-book-open';

            Dep.prototype.setup.call(this);
        },

    });
});
