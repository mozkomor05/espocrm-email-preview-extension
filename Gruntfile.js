const fs = require('fs');
const path = require('path');
const cp = require('child_process');

module.exports = grunt => {
    const gruntLoadJSON = (file) => {
        if (grunt.file.exists(file)) {
            return grunt.file.readJSON(file);
        } else {
            return false;
        }
    };

    const pkg = gruntLoadJSON('package.json'),
        bundle = gruntLoadJSON('extension/bundle.json'),
        libs = gruntLoadJSON('extension/libs.json'),
        moduleNameHyphen = pkg.name,
        moduleName = hyphenCaseToCamelCase(moduleNameHyphen),
        releaseName = `${moduleName}-v${pkg.version}`,
        releaseFolder = `dist/${releaseName}`,
        releaseBackendPath = `${releaseFolder}/files/application/Espo/Modules/${moduleName}/`,
        releaseFrontendPath = `${releaseFolder}/files/client/modules/${moduleNameHyphen}/`;

    if (!pkg) {
        throw new Error('package.json is not found');
    }

    const lessToBuild = {
        target: {}
    }, libFilesToCopy = [], cssToMinify = {};

    const filesToBundle = function (type) {
        if (!bundle || !bundle[type]) {
            return {};
        }

        const files = {};

        for (const [filePath, parts] of Object.entries(bundle[type])) {
            files[`${releaseFolder}/files/${filePath}`] = parts.map(part => `${releaseFolder}/files/${part}`);
        }

        return files;
    };

    const themePath = path.join(__dirname, 'src', 'backend', 'Resources', 'metadata', 'themes');

    if (fs.existsSync(themePath)) {
        fs.readdirSync(themePath).forEach(file => {
            const themeName = camelCaseToHyphenCase(path.basename(file, '.json')),
                filesObj = {};

            filesObj[`${releaseFrontendPath}css/theme/${themeName}.css`] = `src/frontend/css/theme/${themeName}/main.less`;
            filesObj[`${releaseFrontendPath}css/theme/${themeName}-iframe.css`] = `src/frontend/css/theme/${themeName}/iframe/main.less`;

            lessToBuild[themeName] = {
                options: {
                    yuicompress: true,
                    sourceMap: true,
                },
                files: filesObj,
            };

            Object.keys(filesObj).forEach(filePath => {
                const minFilePath = filePath.replace('.css', '.min.css');
                cssToMinify[minFilePath] = filePath;
            });
        });
    }

    if (libs) {
        for (const [libName, lib] of Object.entries(libs)) {
            libFilesToCopy.push({
                expand: true,
                cwd: lib.cwd,
                src: lib.src,
                dest: `${releaseFrontendPath}lib/${libName}/`
            });
        }
    }

    grunt.initConfig({
        pkg: pkg,

        mkdir: {
            release: {
                options: {
                    mode: 0o755,
                    create: [
                        releaseBackendPath,
                        releaseFrontendPath,
                    ],
                }
            }
        },

        clean: {
            release: {
                src: [
                    releaseFolder,
                ],
            },
        },

        less: lessToBuild,

        cssmin: {
            options: {
                sourceMap: true,
            },
            themes: {
                files: cssToMinify,
            },
            bundle: {
                files: filesToBundle('css'),
            },
        },

        uglify: {
            options: {
                mangle: false,
                compress: {
                    drop_console: true,
                },
                sourceMap: true,
            },
            bundle: {
                files: filesToBundle('js'),
            },
        },

        copy: {
            options: {
                mode: true,
            },
            libs: {
                files: libFilesToCopy,
            },
            source: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/backend/',
                        src: ['**'],
                        dest: releaseBackendPath,
                    },
                    {
                        expand: true,
                        src: ['vendor/**'],
                        dest: `${releaseBackendPath}`,
                    },
                    {
                        expand: true,
                        cwd: 'src/client/',
                        src: ['**'],
                        dest: releaseFrontendPath,
                    },
                    {
                        expand: true,
                        cwd: 'src/scripts/',
                        src: ['**'],
                        dest: `${releaseFolder}/scripts/`,
                    },
                ],
            },
        },

        compress: {
            release: {
                options: {
                    archive: `dist/${releaseName}.zip`,
                },
                files: [
                    {
                        expand: true,
                        cwd: releaseFolder,
                        src: [`**/*`],
                    },
                ],
            },
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
            },
            all: {
                src: [
                    '!**/*.min.js',
                    'Gruntfile.js',
                    'src/client/**/*.js',
                ]
            },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('add-manifest', function () {
        const requirements = grunt.file.readJSON('extension/requirements.json');
        grunt.file.write(`${releaseFolder}/manifest.json`, JSON.stringify({
            name: moduleName,
            description: pkg.description,
            author: pkg.author,
            php: requirements.php,
            acceptableVersions: requirements.acceptableVersions,
            version: pkg.version,
            skipBackup: true,
            releaseDate: (new Date()).toISOString().split('T')[0],
        }, null, 4));

        grunt.log.ok('Manifest created successfully.');
    });

    grunt.registerTask('ssh:deploy', function () {
            const {Client} = require('ssh2');
            require('dotenv').config();

            const conn = new Client(),
                done = this.async();

            grunt.log.subhead('Connecting to server...');
            conn.on('ready', () => {
                grunt.log.ok('Connection to server established.');
                conn.sftp((err, sftp) => {
                    if (err) {
                        grunt.log.error(err);
                        return done(false);
                    }

                    grunt.log.ok('SFTP connection established.');
                    grunt.log.subhead('Uploading file...');

                    const remotePath = `${process.env.SSH_ESPO_ROOT_DIR}/data/tmp/${releaseName}.zip`;

                    sftp.fastPut(`dist/${releaseName}.zip`, remotePath, (err) => {
                        if (err) {
                            grunt.log.error(err);
                            return done(false);
                        }

                        grunt.log.ok('File uploaded to server.');
                        sftp.end();

                        grunt.log.subhead('Installing extension...');
                        conn.exec(`php ${process.env.SSH_ESPO_ROOT_DIR}/command.php extension --file="${remotePath}"`, (err, stream) => {
                            if (err) {
                                grunt.log.error(err);
                                return done(false);
                            }

                            stream.on('close', (code, signal) => {
                                conn.end();

                                if (code !== 0) {
                                    grunt.log.error(`Command exited with code ${code}`);
                                    return done(false);
                                }

                                grunt.log.ok('Extension installed successfully.');
                                done();
                            }).on('data', (data) => {
                                grunt.log.verbose.write(data);
                            }).stderr.on('data', (data) => {
                                grunt.log.verbose.write(data);
                            });
                        });
                    });
                });
            }).connect({
                host: process.env.SSH_HOST,
                port: process.env.SSH_PORT,
                username: process.env.SSH_USER,
                password: process.env.SSH_PASSWORD,
            });
        }
    );


    grunt.registerTask('apertia:deploy', function () {
        const axios = require('axios');
        require('dotenv').config();

        const done = this.async();

        if (!pkg.repository || !pkg.repository.url) {
            grunt.log.error('Repository URL is not set.');
            done(false);
        }

        const host = process.env.ESPO_API_URL;
        const url = `${host}/api/v1/Autocrm/action/deployExtension`;

        const headers = {
            'Content-Type': 'application/json',
            "X-Api-Key": `${process.env.ESPO_API_TOKEN}`,
        };

        const data = {
            extensionFile: fs.readFileSync(`dist/${releaseName}.zip`, {encoding: 'base64'}),
            name: moduleNameHyphen,
            version: pkg.version,
            repository: pkg.repository.url,
        };

        grunt.log.subhead('Deploying extension...');
        axios.post(url, data, {headers: headers}).then(response => {
            grunt.log.ok(response.data);
            done();
        }).catch(error => {
            grunt.log.error(error);
            done();
        }).finally(() => {
            grunt.log.ok('Deployment finished.');
            done();
        });
    });

    grunt.registerTask('npm-install', () => {
        cp.execSync("npm ci", {stdio: 'ignore'});
    });

    grunt.registerTask('composer-install', () => {
        if (!grunt.file.exists('composer.json')) {
            grunt.log.writeln('No composer.json found. Skipping composer install.');
            return;
        }

        cp.execSync("composer install --no-dev");
    });

    grunt.registerTask('composer-install-dev', () => {
        cp.execSync("composer install");
    });

    grunt.registerTask('build', [
        'jshint',
        'composer-install',
        'npm-install',
        'clean',
        'mkdir',
        'copy:source',
        'less',
        'cssmin:themes',
        'copy:libs',
        'uglify:bundle',
        'cssmin:bundle',
        'add-manifest',
    ]);

    grunt.registerTask('default', ['build']);

    grunt.registerTask('package', [
        'build',
        'compress:release',
        'clean:release'
    ]);

    grunt.registerTask('deploy', ['package', 'ssh:deploy']);
};

function hyphenCaseToCamelCase(str) {
    return str.replace(/\b-?([a-z])/g, function (g) {
        return g[g.length - 1].toUpperCase();
    });
}

function camelCaseToHyphenCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
