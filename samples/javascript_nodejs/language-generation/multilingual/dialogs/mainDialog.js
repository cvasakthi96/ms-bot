// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityFactory } = require('botbuilder');
const { ChoicePrompt, ComponentDialog, DialogSet, DialogTurnStatus, WaterfallDialog } = require('botbuilder-dialogs');
const { Templates, TemplateExtensions, MultiLanguageLG } = require('botbuilder-lg');
const path = require('path');
const fs = require('fs');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';

class MainDialog extends ComponentDialog {
    constructor() {
        super('MainDialog');

        // Define the main dialog and its related components.
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
            this.showMultilingualResult.bind(this)
        ]));

        // The initial child Dialog to run.
        this.initialDialogId = MAIN_WATERFALL_DIALOG;

        var lgTemplatesMap = new Map();
        lgTemplatesMap.set('fr-fr', Templates.parseFile("./resources/root.lg", this.multilingualResolver('fr-fr')));
        lgTemplatesMap.set('en-us', Templates.parseFile("./resources/root.lg", this.multilingualResolver('en-us')));
        lgTemplatesMap.set("", Templates.parseFile("./resources/root.lg", this.multilingualResolver('')));

        this.generator = new MultiLanguageLG(lgTemplatesMap, undefined);
    }

    multilingualResolver(locale) {
        return  (source, resourceId) => {
            let importPath = TemplateExtensions.normalizePath(resourceId);
            if (!path.isAbsolute(importPath)) {
                // get full path for importPath relative to path which is doing the import.
                importPath = TemplateExtensions.normalizePath(path.join(path.dirname(source), importPath));
            }

            var targetImportPath = importPath.replace('.lg', `.${locale}.lg`);

            // user can do some customized fallback here
            if (!fs.existsSync(targetImportPath) || !fs.statSync(targetImportPath).isFile()) {
                // fallback to itself
                if (!fs.existsSync(importPath) || !fs.statSync(importPath).isFile()) {
                    throw Error(`Could not find file: ${ importPath }`);
                }
            } else {
                importPath = targetImportPath;
            }

            const content = fs.readFileSync(importPath, 'utf-8');
            return { content, id: importPath };
        };
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * Send a Rich Card response to the user based on their choice.
     * This method is only called when a valid prompt response is parsed from the user's response to the ChoicePrompt.
     * @param {WaterfallStepContext} stepContext
     */
    async showMultilingualResult(stepContext) {
        let result = this.generator.generate('barTemplate', undefined, stepContext.context.activity.locale);
        await stepContext.context.sendActivity(ActivityFactory.fromObject(result));

        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;
