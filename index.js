var _ = require('lodash'),
    util = require('./util.js');

var request = require('request').defaults({
    baseUrl: 'https://api.bitbucket.org/2.0/'
});

var pickInputs = ['title', 'description'];

var globalPickResult = {
    'title': 'title',
    'description': 'description',
    'source_branch': 'source.branch',
    'source_repository': 'source.repository',
    'destination_branch': 'destination.branch',
    'reviewers_username': {
        keyName: 'reviewers',
        fields: ['username']
    }
};

module.exports = {

    authParams: function (dexter) {
        var auth = {},
            username = dexter.environment('bitbucket_username'),
            password = dexter.environment('bitbucket_password');

        if (username && password) {

            auth.user = username;
            auth.pass = password;
        }

        return _.isEmpty(auth)? false : auth;
    },

    processResult: function (error, responce, body) {

        if (error)

            this.fail(error);

        else if (responce && !body)

            this.fail(responce.statusCode + ': Something is happened');

        else if (responce && body.error)

            this.fail(responce.statusCode + ': ' + JSON.stringify(body.error));

        else

            this.complete(util.pickResult(body, globalPickResult));

    },

    checkCorrectParams: function (auth, step) {
        var result = true;

        if (!auth) {

            result = false;
            this.fail('A [bitbucket_username, bitbucket_password] environment need for this module.');
        }

        if (!step.input('owner').first() || !step.input('repo_slug').first()) {

            result = false;
            this.fail('A [owner, repo_slug, revision] inputs need for this module.');
        }

        return result;
    },

    formData: function (step) {
        var data = {};

        if (step.input('resource_name').first() !== null)
            _.set(data, 'source.branch.name', step.input('resource_name').first());

        if (step.input('resource_full_name').first() !== null)
            _.set(data, 'source.repository.full_name', step.input('resource_full_name').first());

        if (step.input('destination_name').first() !== null)
            _.set(data, 'destination.branch.name', step.input('destination_name').first());

        if (step.input('destination_hash').first() !== null)
            _.set(data, 'destination.commit.hash', step.input('destination_full_name').first());

        if (step.input('reviewers').first() !== null)
            _.set(data, 'reviewers', _.map(step.input('reviewers').toArray(), function (reviewer) {

                return {username: reviewer};
            }));

        _.map(pickInputs, function (attrName) {

            if (step.input(attrName).first() !== null)
                data[attrName] = step.input(attrName).first();
        });

        return data;
    },

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var auth = this.authParams(dexter);

        // check params.
        if (!this.checkCorrectParams(auth, step)) return;

        var formData = this.formData(step),
            owner = step.input('owner').first().trim(),
            repo_slug = step.input('repo_slug').first().trim();

        var uriLink = 'repositories/' + owner + '/' + repo_slug + '/pullrequests';

        //send API request
        request.post({url: uriLink, body: formData, auth: auth, json: true}, function (error, response, body) {

            this.processResult(error, response, body);
        }.bind(this));
    }
};
