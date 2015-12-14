var _ = require('lodash');

module.exports = {
    /**
     * Return pick result.
     *
     * @param output
     * @param pickTemplate
     * @returns {*}
     */
    pickResult: function (output, pickTemplate) {
        var result = _.isArray(pickTemplate)? [] : {};
        // map template keys
        _.map(pickTemplate, function (templateValue, templateKey) {

            var outputValueByKey = _.get(output, templateValue.keyName || templateValue, undefined);

            if (_.isUndefined(outputValueByKey)) {

                result = _.isEmpty(result)? undefined : result;
                return;
            } else if (_.isUndefined(result)) {

                result = _.isArray(pickTemplate)? [] : {};
            }

            // if template key is object - transform, else just save
            if (_.isArray(pickTemplate)) {

                result = outputValueByKey;
            } else if (_.isObject(templateValue)) {
                // if data is array - map and transform, else once transform
                if (_.isArray(outputValueByKey)) {
                    var mapPickArrays = this._mapPickArrays(outputValueByKey, templateKey, templateValue);

                    result = _.isEmpty(result)? mapPickArrays : _.merge(result, mapPickArrays);
                } else {

                    result[templateKey] = this.pickResult(outputValueByKey, templateValue.fields);
                }
            } else {

                _.set(result, templateKey, outputValueByKey);
            }
        }, this);

        return result;
    },

    /**
     * System func for pickResult.
     *
     * @param mapValue
     * @param templateKey
     * @param templateObject
     * @returns {*}
     * @private
     */
    _mapPickArrays: function (mapValue, templateKey, templateObject) {
        var arrayResult = [],
            result = templateKey === '-'? [] : {};

        _.map(mapValue, function (inOutArrayValue) {
            var pickValue = this.pickResult(inOutArrayValue, templateObject.fields);

            if (pickValue !== undefined)
                arrayResult.push(pickValue);
        }, this);

        if (templateKey === '-') {

            result = arrayResult;
        } else {

            result[templateKey] = arrayResult;
        }

        return result;
    }
};
