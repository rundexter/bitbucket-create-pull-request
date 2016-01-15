var _ = require('lodash'),
    util = require('./util.js');

var request = require('request').defaults({
    baseUrl: 'https://api.bitbucket.org/2.0/'
});

var pickInputs = {
        'owner': { key: 'owner', validate: { req: true } },
        'repo_slug': { key: 'repo_slug', validate: { req: true } },
        'title': 'title',
        'description': 'description',
        'resource_name': 'resource_name',
        'resource_full_name': 'resource_full_name',
        'destination_name': 'destination_name',
        'destination_hash': 'destination_hash',
        'reviewers': { key: 'reviewers', type: 'array' }
    },
    pickOutputs = {
        'title': 'title',
        'description': 'description',
        'source_branch': 'source.branch',
        'source_repository': 'source.repository',
        'destination_branch': 'destination.branch',
        'reviewers_username': {
            key: 'reviewers',
            fields: ['username']
        }
    };

module.exports = {

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
         var credentials = dexter.provider('bitbucket').credentials(),
            inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs);

        // check params.
        if (validateErrors) 
            return this.fail(validateErrors);

        var uriLink = 'repositories/' + inputs.owner + '/' + inputs.repo_slug + '/pullrequests';
        //send API request
        console.log(uriLink, _.omit(inputs, ['owner', 'repo_slug']));
        request.post({ 
            uri: uriLink, 
            body: _.omit(inputs, ['owner', 'repo_slug']), 
            oauth: credentials,
            json: true
        }, function (error, responce, body) {
            if (error || (body && body.error))
                this.fail(error || body.error);
            else
                this.complete(util.pickOutputs(body, pickOutputs) || {});

        }.bind(this));
    }
};
