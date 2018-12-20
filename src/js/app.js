import $ from 'jquery';
import {parseCode,itercode,revertCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let params = $('#codeArguments').val();
        let parsedCode = parseCode(codeToParse);
        let codeSubstitution=itercode(parsedCode,params);
        let code=codeSubstitution[0];
        let colors=codeSubstitution[1];
        let stringCode=revertCode(code);
        let lines=stringCode.split('\n');
        drowFunction(lines,colors);

    });
});

function drowFunction(lines,colors) {
    let j=0;
    for(let i=0;i<lines.length;i++) {
        let start = '';
        if(lines[i].includes('if')){
            start += '<div style="background-color:'+ colors[j] + ';">' ;
            j++;
        }
        else start = '<div>';
        $('#ColoredCode').append(start+lines[i]+'</div>');
    }
}
