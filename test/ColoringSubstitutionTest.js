import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import {codeFromParseCode} from '../src/js/code-analyzer';
import * as CS from '../src/js/ColoringSubstitution.js';

let func1 = 'function foo(x, y, z, k, p){\n' +
    '    let a = x + 1;\n' +
    '    let b = a + y;\n' +
    '    let c = 0;\n' +
    '    \n' +
    '    if (b < z[2]) {\n' +
    '        c = c + 5;\n' +
    '        return x + y + z[1] + c;\n' +
    '    } else if (b > z[2] * 2) {\n' +
    '        c = c + x + 5;\n' +
    '        return x + y + z[0] + c;\n' +
    '    } else if (\'lalala\' === k) {\n' +
    '        c = c + x + 5;\n' +
    '        return x + y + z[0] + c;\n' +
    '    } else if (z[2]*z[2]*-1 - 2 < p) {\n' +
    '        c = c + x + 5;\n' +
    '        return x + y + z[0] + c;\n' +
    '    } else {\n' +
    '        c = c + z[2] + 5;\n' +
    '        return x + y + z[1] + c;\n' +
    '    }\n' +
    '}\n';

let func2 = 'let k = 5;\n' +
    'function foo(x, y, z){\n' +
    '    let c = 0;\n' +
    '    while (x < 2){\n' +
    '        if (x < z){\n' +
    '            x = x + 1;\n' +
    '        }\n' +
    '    }\n' +
    '    return x + y + z + c;\n' +
    '}';

let func3 = 'function foo(x, y){\n' +
    '    let a = x + 1;\n' +
    '    \n' +
    '    if (a < y) {\n' +
    '        a = y * 5;\n' +
    '    } \n' +
    '    return a;\n' +
    '}\n';

let func4 = 'function foo(x, y){\n' +
    '    let a = x + 1;\n' +
    '    if (a < y[0]) {\n' +
    '        a = y[1] * 5;\n' +
    '    } \n' +
    '    return a;\n' +
    '}\n';

let func5 = 'function foo(x, y){\n' +
    '    let a = x + 1;\n' +
    '    if (a < y) {\n' +
    '        a = y * 5;\n' +
    '    }\n' +
    '    else if(a > y) {\n' +
    '        a = y - 5;\n' +
    '    }\n' +
    '    return y;\n' +
    '}';

describe('substitute check1', () => {
    CS.manualInit({a: 'x + 1', b: 'x + 1 + y', 'c[0]': '0 + x + 5', 'c[1]': '555', k: '0'}, [], {});
    let exp, jsonSub, codeSub;
    it('literal', () => {
        exp = parseCode('5');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, '5');
    });
    it('identifier in symTable', () => {
        exp = parseCode('a');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, 'x + 1');
    });
});

describe('substitute check2', () => {
    CS.manualInit({a: 'x + 1', b: 'x + 1 + y', 'c[0]': '0 + x + 5', 'c[1]': '555', k: '0'}, [], {});
    let exp, jsonSub, codeSub;
    it('identifier not in symTable', () => {
        exp = parseCode('d');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, 'd');
    });
    it('UnaryExpression in symTable', () => {
        exp = parseCode('-b');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, '-(x + 1 + y)');
    });
});

describe('substitute check3', () => {
    CS.manualInit({a: 'x + 1', b: 'x + 1 + y', 'c[0]': '0 + x + 5', 'c[1]': '555', k: '0'}, [], {});
    let exp, jsonSub, codeSub;
    it('UnaryExpression in symTable', () => {
        exp = parseCode('-b');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, '-(x + 1 + y)');
    });
    it('UnaryExpression not in symTable', () => {
        exp = parseCode('-d');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, '-d');
    });
});

describe('substitute check4', () => {
    CS.manualInit({a: 'x + 1', b: 'x + 1 + y', 'c[0]': '0 + x + 5', 'c[1]': '555', k: '0'}, [], {});
    let exp, jsonSub, codeSub;
    it('MemberExpression in symTable', () => {
        exp = parseCode('c[1]');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, '555');
    });
    it('property of MemberExpression in symTable', () => {
        exp = parseCode('c[k]');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, '0 + x + 5');
    });
});

describe('substitute check5', () => {
    CS.manualInit({a: 'x + 1', b: 'x + 1 + y', 'c[0]': '0 + x + 5', 'c[1]': '555', k: '0'}, [], {});
    let exp, jsonSub, codeSub;
    it('MemberExpression not in symTable', () => {
        exp = parseCode('c[5]');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, 'c[5]');
    });
    it('left and right of BinaryExpression in symTable', () => {
        exp = parseCode('a + b');
        jsonSub = CS.substitute(exp['body'][0]['expression'], 1);
        codeSub = codeFromParseCode(jsonSub);
        assert.equal(codeSub, 'x + 1 + (x + 1 + y)');
    });
});

describe('getValue check1', () => {
    let exp, value;
    it('literal', () => {
        exp = parseCode('5');
        value = CS.getValue(exp['body'][0]['expression']);
        assert.equal(value, '5');
    });
    it('identifier', () => {
        exp = parseCode('x');
        value = CS.getValue(exp['body'][0]['expression']);
        assert.equal(value, 'x');
    });
    it('UnaryExpression', () => {
        exp = parseCode('-x');
        value = CS.getValue(exp['body'][0]['expression']);
        assert.equal(value, '-x');
    });
});

describe('getValue check2', () => {
    let exp, value;
    it('MemberExpression', () => {
        exp = parseCode('x[5]');
        value = CS.getValue(exp['body'][0]['expression']);
        assert.equal(value, 'x[5]');
    });
    it('BinaryExpression', () => {
        exp = parseCode('x + g[77]');
        value = CS.getValue(exp['body'][0]['expression']);
        assert.equal(value, 'x + g[77]');
    });
});

describe('substitute program check1', () => {
    it('a lot of stuff', () => {
        let parsedCode = parseCode(func1);
        let subJsonCode = CS.substituteProgram(parsedCode);
        let codeAfterSub = codeFromParseCode(subJsonCode);
        assert.equal(codeAfterSub, 'function foo(x, y, z, k, p) {\n' +
            '    if (x + 1 + y < z[2]) {\n' +
            '        return x + y + z[1] + (0 + 5);\n' +
            '    } else if (x + 1 + y > z[2] * 2) {\n' +
            '        return x + y + z[0] + (0 + x + 5);\n' +
            '    } else if (\'lalala\' === 0) {\n' +
            '        return x + y + z[0] + (0 + x + 5);\n' +
            '    } else if (z[2] * z[2] * -1 - 2 < p) {\n' +
            '        return x + y + z[0] + (0 + x + 5);\n' +
            '    } else {\n' +
            '        return x + y + z[1] + (0 + z[2] + 5);\n' +
            '    }\n}');
    });
});

describe('substitute program check2', () => {
    it('all other stuff', () => {
        let parsedCode = parseCode(func2);
        let subJsonCode = CS.substituteProgram(parsedCode);
        let codeAfterSub = codeFromParseCode(subJsonCode);
        assert.equal(codeAfterSub, 'function foo(x, y, z) {\n' +
            '    while (x < 2) {\n' +
            '        if (x < z) {\n' +
            '            x = x + 1;\n' +
            '        }\n    }\n' +
            '    return x + y + z + 0;\n}');
    });
});

describe('coloring check1', () => {
    it('green coloring', () => {
        let args = '1, 3';
        let parsedCode = parseCode(func3);
        let codeAfterColoringSub = CS.coloringSubstituteProgram(parsedCode, CS.argsToArray(args));
        assert.equal(codeAfterColoringSub, 'function foo(x, y) {\n' +
            '    <mark style="background-color: green;"> if (x + 1 < y) {</mark>\n' +
            '    }\n    return x + 1;\n}');
        CS.manualInit({}, [], {});
    });
});

describe('coloring check12', () => {
    it('green coloring with an array arg', () => {
        let args = '1, [3, 5]';
        let parsedCode = parseCode(func4);
        let codeAfterColoringSub = CS.coloringSubstituteProgram(parsedCode, CS.argsToArray(args));
        assert.equal(codeAfterColoringSub, 'function foo(x, y) {\n' +
            '    <mark style="background-color: green;"> if (x + 1 < y[0]) {</mark>\n' +
            '    }\n' +
            '    return x + 1;\n}');
        CS.manualInit({}, [], {});
    });
});

describe('coloring check13', () => {
    it('red coloring', () => {
        let args = '3, 2';
        let parsedCode = parseCode(func3);
        let codeAfterColoringSub = CS.coloringSubstituteProgram(parsedCode, CS.argsToArray(args));
        assert.equal(codeAfterColoringSub, 'function foo(x, y) {\n' +
            '    <mark style="background-color: red;"> if (x + 1 < y) {</mark>\n' +
            '    }\n' +
            '    return x + 1;\n}');
        CS.manualInit({}, [], {});
    });
});

describe('coloring check14', () => {
    it('red and green coloring with else if', () => {
        let args = '3, 2';
        let parsedCode = parseCode(func5);
        let codeAfterColoringSub = CS.coloringSubstituteProgram(parsedCode, CS.argsToArray(args));
        assert.equal(codeAfterColoringSub, 'function foo(x, y) {\n' +
            '    <mark style="background-color: red;"> if (x + 1 < y) {</mark>\n' +
            '    <mark style="background-color: green;"> } else if (x + 1 > y) {</mark>\n    }\n' +
            '    return y;\n}');
        CS.manualInit({}, [], {});
    });
});

