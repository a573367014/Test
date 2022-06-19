#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const ExitCodes = {
    Ok: 0,
    OptionError: 1,
    NoEntryPoints: 2,
    CompileError: 3,
    ValidationError: 4,
    OutputError: 5,
    ExceptionThrown: 6,
};

const td = require('../core');
// const { getOptionsHelp } = require('../core/lib/utils/options/help');
// ModelToObject<ProjectReflection>
/**
 *
 * @param {string} file
 * @param {string} tsconfigFile
 * @returns {{error: object, data: import('../core/lib/serialization/schema').ModelToObject<import('../core/lib/models/index').ProjectReflection>}}
 */
function compileFiles(file, tsconfigFile) {
    const app = new td.Application();

    app.options.addReader(
        new td.ArgumentsReader(0, [file, '--json', './types.json', '--tsconfig', tsconfigFile]),
    );
    app.options.addReader(new td.TSConfigReader());
    app.options.addReader(
        new td.ArgumentsReader(300, [file, '--json', './types.json', '--tsconfig', tsconfigFile]),
    );

    app.bootstrap();

    try {
        const res = run(app);
        return {
            error: null,
            data: res.data,
        };
    } catch (error) {
        console.error('TypeDoc exiting with unexpected error:');
        console.error(error);
        return {
            error,
        };
    }
    //    run(app)
    //     .catch((error) => {
    //       console.error("TypeDoc exiting with unexpected error:");
    //       console.error(error);
    //     //   return ExitCodes.ExceptionThrown;
    //     })
    //     .then((res) => {
    //       // @ts-ignore
    //       process.exitCode = res.exitCode;
    //       // @ts-ignore
    //     //   console.log(res.data);
    //       return res.data;
    //     });

    /** @param {td.Application} app */
    function run(app) {
        if (app.options.getValue('version')) {
            return { exitCode: ExitCodes.Ok, data: '' };
        }

        if (app.options.getValue('help')) {
            return { exitCode: ExitCodes.Ok, data: '' };
        }

        if (app.options.getValue('showConfig')) {
            return { exitCode: ExitCodes.Ok, data: '' };
        }

        if (app.logger.hasErrors()) {
            return { exitCode: ExitCodes.OptionError, data: '' };
        }
        if (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings()) {
            //   return ExitCodes.OptionError;
            return { exitCode: ExitCodes.OptionError, data: '' };
        }

        if (app.options.getValue('entryPoints').length === 0) {
            app.logger.error('No entry points provided');
            //   return ExitCodes.NoEntryPoints;
            return { exitCode: ExitCodes.NoEntryPoints, data: '' };
        }

        // if (app.options.getValue('watch')) {
        //     app.convertAndWatch(async (project) => {
        //         const out = app.options.getValue('out');
        //         if (out) {
        //              app.generateDocs(project, out);
        //         }
        //         const json = app.options.getValue('json');
        //         if (json) {
        //             //   console.log("project", json);
        //              app.generateJson(project, json);
        //         }

        //         if (!out && !json) {
        //              app.generateDocs(project, './docs');
        //         }
        //     });
        //     //   return ExitCodes.Ok;
        //     return { exitCode: ExitCodes.Ok, data: '' };
        // }

        const project = app.convert();
        if (!project) {
            //   return ExitCodes.CompileError;
            return { exitCode: ExitCodes.CompileError, data: '' };
        }
        if (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings()) {
            //   return ExitCodes.CompileError;
            return { exitCode: ExitCodes.CompileError, data: '' };
        }

        app.validate(project);
        if (app.logger.hasErrors()) {
            //   return ExitCodes.ValidationError;
            return { exitCode: ExitCodes.ValidationError, data: '' };
        }
        if (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings()) {
            //   return ExitCodes.ValidationError;
            return { exitCode: ExitCodes.ValidationError, data: '' };
        }

        if (app.options.getValue('emit') !== 'none') {
            const out = app.options.getValue('out');
            if (out) {
                app.generateDocs(project, out);
            }
            const json = app.options.getValue('json');
            if (json) {
                // console.log("project", json);
                const data = app.generateJson(project, json);
                return { exitCode: ExitCodes.Ok, data };
            }

            if (!out && !json) {
                app.generateDocs(project, './docs');
            }

            if (app.logger.hasErrors()) {
                // return ExitCodes.OutputError;
                return { exitCode: ExitCodes.OutputError, data: '' };
            }
            if (app.options.getValue('treatWarningsAsErrors') && app.logger.hasWarnings()) {
                // return ExitCodes.OutputError;
                return { exitCode: ExitCodes.OutputError, data: '' };
            }
        }

        // return ExitCodes.Ok;
        return { exitCode: ExitCodes.Ok, data: '' };
    }
}

module.exports = {
    compileFiles,
};
