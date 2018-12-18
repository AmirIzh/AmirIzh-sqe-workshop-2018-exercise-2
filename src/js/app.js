import $ from 'jquery';
import {parseCode} from './code-analyzer';
import * as CS from './ColoringSubstitution.js';

$(document).ready(function (){
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#argumentsHolder').val();
        let parsedCode = parseCode(codeToParse);
        let codeAfterColoringSub = CS.coloringSubstituteProgram(parsedCode, CS.argsToArray(args));
        $('#parsedCode').empty();
        $('#parsedCode').append('\n' + codeAfterColoringSub);
        CS.manualInit({}, [], {});
        //$('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});

