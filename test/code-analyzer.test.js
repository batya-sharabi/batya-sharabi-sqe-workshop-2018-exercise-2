import assert from 'assert';
import {parseCode,itercode,revertCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    testSimpleFunction();
    testLocalVariable();
    testIfStatements();
    testWhileStatement();
});

function testSimpleFunction(){
    it('is substituting a simple function correctly', () => {
        assert.deepEqual(
            getSub(parseCode('function f(x,y) {}'),'1,2'),
            'function f(x, y) {\n}'
        );
        assert.deepEqual(
            getSub(parseCode('function f(x) {return x;}'),'1'),
            'function f(x) {\n' +
            '    return x;\n' +
            '}'
        );

    });
}

function testLocalVariable(){
    it('is substituting a local variable correctly', () => {
        assert.deepEqual(
            getSub(parseCode('function f(x) {let a=x+1;return a;}'),'2'),
            'function f(x) {\n' +
            '    return x + 1;\n' +
            '}'
        );
        assert.deepEqual(
            getSub(parseCode('function f(x) {let a=x+1;a=a+1;return a;}'),'3'),
            'function f(x) {\n' +
            '    return x + 1 + 1;\n' +
            '}'
        );
        assert.deepEqual(
            getSub(parseCode('function f(x) {let a;a=x+1;return a;}'),'3'),
            'function f(x) {\n' +
            '    return x + 1;\n' +
            '}'
        );
        assert.deepEqual(
            getSub(parseCode('function f(x,y) {x=y+2;let a=x+1;return a;}'),'3,4'),
            'function f(x, y) {\n' +
            '    x = y + 2;\n' +
            '    return x + 1;\n' +
            '}'
        );
        assert.deepEqual(
            getSub(parseCode('function f(x,y) {x[0]=y+2;let a=[1,2,3];a[0]=x[0];return a;}'),'[3,2],4'),
            'function f(x, y) {\n' +
            '    x[0] = y + 2;\n'+
            '    return [\n        x[0],\n        2,\n        3\n    ];\n' +
            '}'
        );

    });
}

function testIfStatements() {
    it('is substituting a if statement correctly', () => {
        assert.deepEqual(
            getSub(parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' +
                '    if (b < z) {\n' + '        c = c + 5;\n' + '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '        return x + y + z + c;\n' +
                '    } else {\n' + '        c = c + z + 5;\n' + '        return x + y + z + c;\n' + '    }\n' + '}'),'1,2,3'),
            'function foo(x, y, z) {\n' +
            '    if (x + 1 + y < z) {\n' +
            '        return x + y + z + (0 + 5);\n' +
            '    } else if (x + 1 + y < z * 2) {\n' +
            '        return x + y + z + (0 + x + 5);\n' +
            '    } else {\n' +
            '        return x + y + z + (0 + z + 5);\n' +
            '    }\n' + '}'
        );
        assert.deepEqual(
            getSub(parseCode('function f(x,y) {x[0]=y+2;let a=[1,2,3];a[0]=x[0];if (!(a[0] < y)) {return y;}}'),'[3,2],4'),
            'function f(x, y) {\n' +
            '    x[0] = y + 2;\n'+
            '    if (!(x[0] < y)) {\n'+
            '        return y;\n' +
            '    }\n'+
            '}'
        );
        assert.deepEqual(
            getSub(parseCode('function f(x,y) {let a=[1,2,3];a[0]=x[0];if (x.length < y) {return a;}}'),'[3,2],4'),
            'function f(x, y) {\n' +
            '    if (x.length < y) {\n'+
            '        return [\n            x[0],\n            2,\n            3\n        ];\n' +
            '    }\n'+
            '}'
        );

    });
}

function testWhileStatement() {
    it('is substituting a while statement correctly', () => {
        assert.deepEqual(
            getSub(parseCode('let b=1;function f(x) {let a=x+1;while(a<b){return a;}}'),'2'),
            'function f(x) {\n' +
            '    while (x + 1 < 1) {\n'+
            '        return x + 1;\n' +
            '    }\n'+
            '}'
        );
    });
}

function getSub(parsedCode,params) {
    let codeSubstitution=itercode(parsedCode,params);
    let code=codeSubstitution[0];
    //let colors=codeSubstitution[1];
    let stringCode=revertCode(code);
    return stringCode;
}
