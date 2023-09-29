/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const _ = require('lodash');
const aws = require('aws-sdk');
const qnabot = require('qnabot/logging');

// resolves Lambda function name for bundled example lambdas refernced in env.
function getLambdaName(lambdaRef) {
    const match = lambdaRef.match(/QNA:(.*)/);
    if (match) {
        return process.env[match[1]] || lambdaRef;
    }
    return lambdaRef;
}
// used to invoke either chaining rule lambda, or Lambda hook

async function invokeLambda(lambdaRef, req, res) {
    const lambdaName = getLambdaName(lambdaRef);
    qnabot.log('Calling Lambda:', lambdaName);
    const event = { req, res };
    const lambda = new aws.Lambda();
    const lambdares = await lambda
        .invoke({
            FunctionName: lambdaName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify(event),
        })
        .promise();
    let payload = lambdares.Payload;
    try {
        payload = JSON.parse(payload);
        if (_.get(payload, 'req') && _.get(payload, 'res')) {
            req = _.get(payload, 'req');
            res = _.get(payload, 'res');
        }
    } catch (e) {
        // response is not JSON - noop
    }
    qnabot.log('Lambda returned payload: ', payload);
    return [req, res];
}
exports.invokeLambda = invokeLambda;
