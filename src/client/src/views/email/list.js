define('email-combined-view:views/email/list', ['views/email/list'], function (Dep) {
    return Dep.extend({

        template: 'email-combined-view:email/list',

        searchView: 'email-combined-view:views/email/record/search',

        skipBuildRows: true,

        data: function () {
            const data = Dep.prototype.data.call(this);
            data.isCombinedMode = this.viewMode === 'combined';

            return data;
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            // Backwards compatibility
            if ('initStickableFolders' in this) {
                this.initStickableFolders();
            }
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
        }

    });
});
