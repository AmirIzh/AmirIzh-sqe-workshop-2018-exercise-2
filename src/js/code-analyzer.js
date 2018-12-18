import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

const codeFromParseCode = (parseCode) => {
    return escodegen.generate(parseCode);
};

export {parseCode};
export {codeFromParseCode};