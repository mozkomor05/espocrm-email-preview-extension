define('email-combined-view:views/email/record/search', ['views/record/search'], function (Dep) {
    return Dep.extend({
        viewModeIconClassMap: _.extend({
            combined: 'fas fa-book-open',
        }, Dep.prototype.viewModeIconClassMap),
    });
});
