define(() => {
    /**
     * @memberOf module:email-combined-view:helpers/version
     */
    class Class {
        /**
         * @param metadata {module:metadata.Class} Metadata util
         * @param settings {module:models/settings.Class} Settings util
         */
        constructor(metadata, settings) {
            this.metadata = metadata;
            this.settings = settings;

            this.currentVersion = this.settings.get('version');
        }

        /**
         * @param {string} ver Version string
         */
        isGreater(ver) {
            return this._versionCompare(ver) === 1;
        }

        /**
         * @param {string} ver Version string
         */
        isGreaterOrEqual(ver) {
            return this._versionCompare(ver) !== -1;
        }

        /**
         * @param {string} ver Version string
         */
        isLess(ver) {
            return this._versionCompare(ver) === -1;
        }

        /**
         * @param {string} ver Version string
         */
        isLessOrEqual(ver) {
            return this._versionCompare(ver) !== 1;
        }

        /**
         * @param {string} ver Version string
         */
        isEqual(ver) {
            return this._versionCompare(ver) === 0;
        }

        /**
         * @param {string} ver Version string
         * @returns {(1|-1|0)}
         */
        _versionCompare(ver) {
            const a = this.currentVersion.split('.');
            const b = ver.split('.');

            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return a[i] > b[i] ? 1 : -1;
                }
            }

            return 0;
        }
    }

    return Class;
});
