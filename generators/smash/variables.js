'use strict';

goog.provide('Blockly.smash.variables');

goog.require('Blockly.smash');


Blockly.smash['variables_get'] = function(block) {
    // Variable getter.
    var code = '${' + Blockly.smash.variableDB_.getName(block.getFieldValue('VAR'),
        Blockly.Variables.NAME_TYPE)  + '}';
    return [code, Blockly.smash.ORDER_ATOMIC];
};

Blockly.smash['variables_set'] = function(block) {
    // Variable setter.
    var argument0 = Blockly.smash.valueToCode(block, 'VALUE',
            Blockly.smash.ORDER_ASSIGNMENT) || '0';
    var varName = Blockly.smash.variableDB_.getName(
        block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
    return varName + '=' + argument0 + '\n';
};
