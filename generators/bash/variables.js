'use strict';

goog.provide('Blockly.bash.variables');

goog.require('Blockly.bash');


Blockly.bash['variables_get'] = function(block) {
    // Variable getter.
    var code = '${' + Blockly.bash.variableDB_.getName(block.getFieldValue('VAR'),
        Blockly.Variables.NAME_TYPE)  + '}';
    return [code, Blockly.bash.ORDER_ATOMIC];
};

Blockly.bash['variables_set'] = function(block) {
    // Variable setter.
    var argument0 = Blockly.bash.valueToCode(block, 'VALUE',
            Blockly.bash.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.bash.variableDB_.getName(
        block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return varName + '=' + argument0 + '\n';
};
