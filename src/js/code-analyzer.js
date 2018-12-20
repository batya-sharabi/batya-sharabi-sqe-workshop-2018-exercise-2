import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let args={};
let oldArgs={};
let valueArgument={};
let araayColors=[];
let Input=[];

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse,{loc:true});
};

const revertCode = (code) => {
    return escodegen.generate(code);
};

export {parseCode,itercode};
export {revertCode};

const itercode = (parsedCode,params) => {
    let parse=parseCode(params);
    if (params!=null)
        if(parse.body[0].expression.expressions!=null){
            Input=parse.body[0].expression.expressions;
        }
        else Input[0]=parse.body[0].expression.expressions;
    for (let i=0 ; i<parsedCode.body.length; i++){
        if(parsedCode.body[i].type=='FunctionDeclaration')
            continue;
        parsedCode.body[i]=loopItercode(parsedCode.body[i]);
        if(parsedCode.body[i]==null) delete parsedCode.body[i];
    }
    let body = [];
    for (let i = 0; i < parsedCode.body.length; i++){
        if (parsedCode.body[i]!=null) body.push(parsedCode.body[i]);
    }
    parsedCode.body=body;
    for (let i=0 ; i<parsedCode.body.length; i++){
        if(parsedCode.body[i].type!='FunctionDeclaration')
            continue;
        parsedCode.body[i]=loopItercode(parsedCode.body[i]);
    }
    let toReturn=new Array(2);
    toReturn[0]=parsedCode;
    toReturn[1]=araayColors;
    return toReturn;
};

function loopItercode(codeJsonBody){
    if((codeJsonBody.type == 'Literal') ||(codeJsonBody.type == 'updateExpression'))
        return codeJsonBody;
    let func = loopFunction[codeJsonBody.type];
    return func(codeJsonBody);
}
const loopFunction = {
    Identifier: identifier,
    //UpdateExpression: updateExpression,
    ArrayExpression: arrayExpression,
    BlockStatement: blockStatement,
    ExpressionStatement: expressionStatement,
    VariableDeclaration: variableDeclaration,
    BinaryExpression: binaryExpression,
    UnaryExpression: unaryExpression,
    MemberExpression: memberExpression,
    ReturnStatement: returnStatement,
    AssignmentExpression: assignmentExpression,
    IfStatement: ifStatement,
    WhileStatement: whileStatement,
    FunctionDeclaration :functionDeclaration
};

function functionDeclaration(codeJsonBody) {
    for (let i=0 ; i<codeJsonBody.params.length; i++){
        valueArgument[codeJsonBody.params[i].name]=Input[i];
    }
    loopItercode(codeJsonBody.body);
    return codeJsonBody;
}

function variableDeclaration(codeJsonBody){
    for(let i=0 ; i<codeJsonBody.declarations.length; i++){
        if(codeJsonBody.declarations[i].init!=null){
            codeJsonBody.declarations[i].init = loopItercode(codeJsonBody.declarations[i].init);
            args[codeJsonBody.declarations[i].id.name]=codeJsonBody.declarations[i].init;
        }
    }
    return null;
}

function expressionStatement(codeJsonBody){
    codeJsonBody.expression=loopItercode(codeJsonBody.expression);
    if(codeJsonBody.expression==null) {
        delete codeJsonBody.expression;
        return null;
    }
    return codeJsonBody;
}

function assignmentExpression(codeJsonBody) {
    codeJsonBody.right=loopItercode(codeJsonBody.right);
    if(codeJsonBody.left.type=='Identifier'){
        if(codeJsonBody.left.name in args)
            args[codeJsonBody.left.name]=codeJsonBody.right;
        else{
            valueArgument[codeJsonBody.left.name]=codeJsonBody.right;
            return codeJsonBody;
        }
    }
    else if(codeJsonBody.left.type=='MemberExpression') {
        codeJsonBody.left.property=loopItercode(codeJsonBody.left.property);
        if(codeJsonBody.left.object.name in args)
            args[codeJsonBody.left.object.name].elements[codeJsonBody.left.property]=codeJsonBody.right;
        else{
            valueArgument[codeJsonBody.left.object.name].elements[codeJsonBody.left.property.raw]=codeJsonBody.right;
            return codeJsonBody;
        }
    }
    return null;
}

function arrayExpression(codeJsonBody) {
    for (let i=0;i<codeJsonBody.elements.length;i++){
        codeJsonBody.elements[i]=loopItercode(codeJsonBody.elements[i]);
    }
    return codeJsonBody;
}


function binaryExpression(codeJsonBody){
    codeJsonBody.left=loopItercode(codeJsonBody.left);
    codeJsonBody.right=loopItercode(codeJsonBody.right);
    return codeJsonBody;
}


function identifier(codeJsonBody) {
    if(codeJsonBody.name in args)
        return args[codeJsonBody.name];
    else return codeJsonBody;
}

function whileStatement(codeJsonBody){
    codeJsonBody.test=loopItercode(codeJsonBody.test);
    codeJsonBody.body=loopItercode(codeJsonBody.body);
    return codeJsonBody;
}


function ifStatement(codeJsonBody){
    codeJsonBody.test=loopItercode(codeJsonBody.test);
    colorLines(codeJsonBody.test);
    codeJsonBody.consequent=loopItercode(codeJsonBody.consequent);
    if(codeJsonBody.alternate!=null) {
        codeJsonBody.alternate=alternate(codeJsonBody.alternate);
    }
    return codeJsonBody;
}

function alternate(codeJsonBody){
    if (codeJsonBody.type == 'IfStatement') {
        codeJsonBody=ifStatement(codeJsonBody);
    }
    else
        codeJsonBody=loopItercode(codeJsonBody);
    return codeJsonBody;
}

function memberExpression(codeJsonBody) {
    codeJsonBody.property=loopItercode(codeJsonBody.property);
    return codeJsonBody;
}

/*function updateExpression(codeJsonBody) {
    if(codeJsonBody.argument.name in args){
        args[codeJsonBody.argument.name]=args[codeJsonBody.argument.name]+1;
    }
    else if(codeJsonBody.argument.name in valueArgument){
        valueArgument[codeJsonBody.argument.name]=valueArgument[codeJsonBody.argument.name]+1;
        return codeJsonBody;
    }

}*/

function unaryExpression(codeJsonBody){
    codeJsonBody.argument=loopItercode(codeJsonBody.argument);
    return codeJsonBody;
}

function returnStatement(codeJsonBody){
    codeJsonBody.argument=loopItercode(codeJsonBody.argument);
    return codeJsonBody;
}

function blockStatement(codeJsonBody,rows) {
    oldArgs = {};
    for(let obj in args){
        oldArgs[obj]=args[obj];
    }
    for (let i = 0; i < codeJsonBody.body.length; i++) {
        codeJsonBody.body[i]=loopItercode(codeJsonBody.body[i], rows);
        if(codeJsonBody.body[i]==null) delete codeJsonBody.body[i];
    }
    let body = [];
    for (let i = 0; i < codeJsonBody.body.length; i++){
        if (codeJsonBody.body[i]!=null) body.push(codeJsonBody.body[i]);
    }
    codeJsonBody.body=body;
    args = {};
    for(let obj in oldArgs){
        args[obj]=oldArgs[obj];
    }
    return codeJsonBody;
}

function colorLines(jsonTest) {
    let test=revertCode(jsonTest);
    let splitTest=test.split(' ');
    splitTest=replaceValue(splitTest);
    test=splitTest.join(' ');
    splitTest=test.split(' ');
    splitTest=replaceValue(splitTest);
    test=splitTest.join(' ');
    let ifGreen=eval(test);
    if(ifGreen==true){
        araayColors.push('green');
    }
    else araayColors.push('red');
}

function replaceValue(splitTest) {
    for (let i=0;i<splitTest.length;i++){
        if (splitTest[i].includes('(')){
            splitTest[i]=(splitTest[i].substring(0,splitTest[i].indexOf('('))+' '+splitTest[i].substring(splitTest[i].indexOf('('),splitTest[i].indexOf('(')+1)+' '+splitTest[i].substring(splitTest[i].indexOf('(')+1));
        }
        else if (splitTest[i].includes(')')){
            splitTest[i]=splitTest[i].substring(0,splitTest[i].indexOf(')'))+' '+splitTest[i].substring(splitTest[i].indexOf(')'),splitTest[i].indexOf(')')+1)+' '+splitTest[i].substring(splitTest[i].indexOf(')')+1);
        }
        else if(splitTest[i] in valueArgument){
            splitTest[i]=revertCode(valueArgument[splitTest[i]]);
        }
        else if(splitTest[i].indexOf('[') !== -1 && splitTest[i].substring(0,splitTest[i].indexOf('[')) in valueArgument){
            let argument=splitTest[i].substring(0,splitTest[i].indexOf('['));
            let property=splitTest[i].substring(splitTest[i].indexOf('[')+1,splitTest[i].indexOf(']'));
            splitTest[i]=revertCode(valueArgument[argument].elements[property]);
        }
        else if(splitTest[i].includes('.')){
            let argument=splitTest[i].substring(0,splitTest[i].indexOf('.'));
            let property=splitTest[i].substring(splitTest[i].indexOf('.')+1);
            if(!argument.includes('['))
                splitTest[i]=revertCode(valueArgument[argument])+'.'+property;
        }
    }
    return splitTest;
}

