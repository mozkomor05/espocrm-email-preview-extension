define('email-combined-view:views/email/list', ['views/email/list'], function (Dep) {
    return Dep.extend({
        searchView: 'email-combined-view:views/email/record/search',
        template: 'email-combined-view:email/list',
        skipBuildRows: true,

        data: function () {
            const data = Dep.prototype.data.call(this);
            data.isCombinedMode = this.viewMode === 'combined';

            return data;
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
        },
    });
});
