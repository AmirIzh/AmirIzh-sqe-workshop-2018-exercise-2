import * as esprima from 'esprima';
import {codeFromParseCode} from './code-analyzer';

let symTab = {};
let params = [];
let argsInit = {};

function coloringSubstituteProgram(jsonCode, args){
    let subJsonCode = substituteProgram(jsonCode);
    let subCode = codeFromParseCode(subJsonCode);

    for(let i = 0; i < args.length; i++)
        argsInit[params[i]] = args[i];
    for(let i = 0; i < args.length; i++)
        if(args[i][0] === '[') arrayExtract(args[i].substring(1, args[i].length - 1));
    return colorProgram(subCode);
}

function getKeyArr(strArr){
    for(let key in argsInit)
        if(argsInit[key] === '[' + strArr + ']')
            return key;
}

function arrayExtract(strArr){
    let arrKey = getKeyArr(strArr), curElement = '', curElementNum = 0;

    for(let i = 0; i < strArr.length; i++){
        while(i < strArr.length && strArr[i] !== ','){
            if(strArr[i] === ' '){
                i++; continue;
            }
            curElement += strArr[i];
            i++;
        }
        argsInit[arrKey + '[' + curElementNum.toString() + ']'] = curElement;
        curElementNum++;
        curElement = '';
    }
}

function colorProgram(subCode){
    let foundTest = false, startOfLine, colorProgram2Ans;

    for(let i = 0; i < subCode.length - 5; i++){
        if(subCode.substring(i, i + 4) === 'if ('){
            startOfLine = i;
            i += 4;
            foundTest = true;}
        else if(subCode.substring(i, i + 9) === 'else if ('){
            startOfLine = i - 2;
            i += 9;
            foundTest = true;}
        if(foundTest){
            colorProgram2Ans = colorProgram2(subCode, startOfLine, i);
            subCode = colorProgram2Ans[0];
            i = colorProgram2Ans[1];}
        foundTest = false;
    }
    return subCode;
}

function colorProgram2(subCode, startOfLine, i){
    let startOfTest, endOfTest, markOpener, ans = [];

    startOfTest = i;
    while(subCode[i] !== '{') i++;
    endOfTest = i - 2;
    markOpener = decideColor(subCode.substring(startOfTest, endOfTest));
    ans[0] = subCode.substring(0, startOfLine) + markOpener + subCode.substring(startOfLine, endOfTest + 3) + '</mark>' + subCode.substring(endOfTest + 3, subCode.length);
    ans[1] = i + 40;

    return ans;
}

function decideColor(test){
    let JsonTest = esprima.parseScript(test)['body'][0]['expression'];
    let subJsonTest = substitute(JsonTest, 2);
    let subCodeTest = codeFromParseCode(subJsonTest);
    let ans = eval(subCodeTest);

    if(ans) return '<mark style="background-color: green;"> ';
    return '<mark style="background-color: red;"> ';
}

function substituteProgram(jsonCode){
    for(let i = 0; i < jsonCode['body'].length; i++){
        if(jsonCode['body'][i]['type'] === 'VariableDeclaration'){
            processVariableDeclaration(jsonCode['body'][i]['declarations']);
            jsonCode['body'][i] = null;
        }
        else{
            for(let j = 0; j < jsonCode['body'][i]['params'].length; j++)
                params[j] = getValue(jsonCode['body'][i]['params'][j]);
            jsonCode['body'][i]['body']['body'] = processBlockStatement(jsonCode['body'][i]['body']['body']);
        }
    }
    jsonCode['body'] = getNotNullsFromBody(jsonCode['body']);
    return jsonCode;
}

function processBlockStatement(body){
    for(let i = 0; i < body.length; i++){
        if(body[i]['type'] === 'VariableDeclaration'){
            processVariableDeclaration(body[i]['declarations']);
            body[i] = null;
        }
        else body = processBlockStatement2(body, i);
    }

    return getNotNullsFromBody(body);
}

function processBlockStatement2(body, i){
    if(body[i]['type'] === 'ExpressionStatement' && body[i]['expression']['type'] === 'AssignmentExpression'){
        processAssignmentExpression(body[i]['expression']);
        if(!params.includes(getValue(body[i]['expression']['left']), 0))
            body[i] = null;
    }
    else body = processBlockStatement3(body, i);

    return body;
}

function processBlockStatement3(body, i){
    if(body[i]['type'] === 'IfStatement') body[i] = processIfStatement(body[i]);
    else if(body[i]['type'] === 'WhileStatement') body[i] = processWhileStatement(body[i]);
    else processReturnStatement(body[i]);

    return body;
}

function getNotNullsFromBody(body){
    let ans = [], ansCount = 0;

    for(let i = 0; i < body.length; i++){
        if(body[i] != null){
            ans[ansCount] = body[i];
            ansCount++;
        }
    }

    return ans;
}

function processWhileStatement(WhileStatement){
    let ans = WhileStatement;

    ans['test'] = substitute(WhileStatement['test'], 1);
    ans['body']['body'] = processBlockStatement(WhileStatement['body']['body']);

    return ans;
}

function processIfStatement(IfStatement){
    let ans = IfStatement;
    let symTabCopy = {};

    for(let key in symTab)
        symTabCopy[key] = symTab[key];

    ans['test'] = substitute(IfStatement['test'], 1);
    ans['consequent']['body'] = processBlockStatement(IfStatement['consequent']['body']);

    if(IfStatement['alternate'] != null){
        symTab = symTabCopy;
        if(IfStatement['alternate']['type'] === 'IfStatement')
            ans['alternate'] = processIfStatement(IfStatement['alternate']);
        else
            ans['alternate']['body'] = processBlockStatement(IfStatement['alternate']['body']);
    }
    symTab = symTabCopy;
    return ans;
}

function processAssignmentExpression(exp){
    let name = getValue(exp['left']);
    let subRight = substitute(exp['right'], 1);

    symTab[name] = getValue(subRight);
}

function processVariableDeclaration(declarations){
    for(let key in declarations){
        let subInit = substitute(declarations[key]['init'], 1);
        let declName = declarations[key]['id']['name'];
        symTab[declName] = getValue(subInit);
    }
}

function processReturnStatement(exp){
    if(!params.includes(getValue(exp['argument']), 0))
        exp['argument'] = substitute(exp['argument'], 1);
    return exp;
}

function getValue(exp){
    if(exp['type'] === 'Literal') return JSON.stringify(exp['value'], null, 2);
    else if(exp['type'] === 'Identifier') return exp['name'];
    else if(exp['type'] === 'UnaryExpression') return getValueUnaryExp(exp);
    else if(exp['type'] === 'MemberExpression') return getValueMemExp(exp);
    else return getValueBinExp(exp);
}

function getValueUnaryExp(exp){
    let operator = exp['operator'];
    let val = getValue(exp['argument']);

    return '' + operator + '' + val;
}

function getValueMemExp(exp){
    let object = exp['object']['name'];
    let prop = getValue(exp['property']);

    return '' + object + '[' + prop + ']';
}

function getValueBinExp(exp){
    let operator = exp['operator'];
    let left = getValue(exp['left']);
    let right = getValue(exp['right']);

    return '' + left + ' ' + operator + ' ' + right;
}

function substitute(exp, mapOption){
    let ans = exp;

    if(relevantIdentifier(exp)) ans = substituteIdentifier(ans, exp, mapOption);
    else if(exp['type'] === 'UnaryExpression') ans = substituteUnaryExpression(ans, exp, mapOption);
    else if(exp['type'] === 'MemberExpression') ans = substituteMemberExpression(ans, exp, mapOption);
    else if(exp['type'] === 'BinaryExpression'){
        ans['left'] = substitute(exp['left'], mapOption);
        ans['right'] = substitute(exp['right'], mapOption);
    }

    return ans;
}

function relevantIdentifier(exp){
    return exp['type'] === 'Identifier' && (symTab[exp['name']] != null || argsInit[exp['name']] != null);
}

function substituteIdentifier(ans, exp, mapOption){
    let newVal;
    if(mapOption === 1) newVal = symTab[exp['name']];
    else newVal = argsInit[exp['name']];
    return esprima.parseScript(newVal)['body'][0]['expression'];
}

function substituteUnaryExpression(ans, exp, mapOption){
    let newVal;
    let subArg = substitute(exp['argument'], mapOption);
    newVal = '' + exp['operator'] + '(' + getValue(subArg) + ')';
    return esprima.parseScript(newVal)['body'][0]['expression'];
}

function substituteMemberExpression(ans, exp, mapOption){
    ans['property'] = substitute(exp['property'], mapOption);
    if(mapOption === 1 && symTab[codeFromParseCode(ans)] != null)
        return esprima.parseScript(symTab[codeFromParseCode(ans)])['body'][0]['expression'];
    else if(argsInit[codeFromParseCode(ans)] != null)
        return esprima.parseScript(argsInit[codeFromParseCode(ans)])['body'][0]['expression'];
    else return ans;
}

function manualInit(manualSymTab, manualParams, manualArgsInit){
    symTab = manualSymTab;
    params = manualParams;
    argsInit = manualArgsInit;
}

function argsToArray(args){
    let argsArr = [], curArg = '', argsCount = 0, arrayGatherAns;
    for(let i = 0; i < args.length; i++){
        while(i < args.length && args[i] !== ','){
            if(args[i] === ' '){
                i++; continue;
            }
            arrayGatherAns = arrayGather(args, i, curArg);
            curArg = arrayGatherAns[0];
            i = arrayGatherAns[1];
            curArg += args[i];
            i++;
        }
        argsArr[argsCount] = curArg;
        argsCount++;
        curArg = '';
    }
    return argsArr;
}

function arrayGather(args, i, curArg){
    let ans = [];

    if(args[i] === '['){
        while(args[i] !== ']'){
            curArg += args[i];
            i++;
        }
    }
    ans[0] = curArg;
    ans[1] = i;

    return ans;
}

export{coloringSubstituteProgram};
export{substituteProgram};
export{getValue};
export{substitute};
export{manualInit};
export{argsToArray};
