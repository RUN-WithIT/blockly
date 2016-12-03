'use strict';

goog.provide('Blockly.smash.logic');

goog.require('Blockly.smash');


Blockly.smash['controls_if'] = function(block) {
  // If/elseif/else condition.
  var n = 0;
  var argument = Blockly.smash.valueToCode(block, 'IF' + n,
      Blockly.smash.ORDER_NONE) || '';
  var branch = Blockly.smash.statementToCode(block, 'DO' + n);
  var code = 'if [ ' + argument + ' ] ; then \n' + branch;
  for (n = 1; n <= block.elseifCount_; n++) {
    argument = Blockly.smash.valueToCode(block, 'IF' + n,
        Blockly.smash.ORDER_NONE) || '';
    branch = Blockly.smash.statementToCode(block, 'DO' + n);
    code += ' elif [ ' + argument + ' ] ; then\n' + branch;
  }
  if (block.elseCount_) {
    branch = Blockly.smash.statementToCode(block, 'ELSE');
    code += ' else \n' + branch ;
  }
  return code + 'fi\n';
};

Blockly.smash['logic_compare'] = function(block) {
    // Comparison operator.
    var OPERATORS = {
	'EQ': '-eq',
	'NEQ': '-ne',
	'LT': '-lt',
	'LTE': '-le',
	'GT': '-gt',
	'GTE': '-ge'
    };
    var operator = OPERATORS[block.getFieldValue('OP')];
    var order = (operator == '-eq' || operator == '-ne') ?
    Blockly.smash.ORDER_EQUALITY : Blockly.smash.ORDER_RELATIONAL;
    //    if (typeof argument0 == "string" && typeof argument1 == "string")
    var argument0 = Blockly.smash.valueToCode(block, 'A', order) || '0';
    var argument1 = Blockly.smash.valueToCode(block, 'B', order) || '0';

    var code = argument0  + ' ' + operator + ' ' + argument1;
    return [code, order];

    // if either argument is a non-variable string, then change operators
    // and quote things
//     if ((typeof(argument0) == "string" && argument0.charAt(0) != '$') ||
// 	(typeof(argument1) == "string" && argument1.charAt(0) != '$'))
// 	{
// 	    var OPERATORS = {
// 		'EQ': '==',
// 		'NEQ': '!=',
// 		'LT': '\<',
// 		'LTE': '\<=',
// 		'GT': '\>',
// 		'GTE': '\>='
// 	    };
// 	    var operator = OPERATORS[block.getFieldValue('OP')];
	    
// 	    var code = '"' + argument0 + '"' + ' ' + operator + ' ' + '"' + argument1 + '"';
// 	    return [code, order];
// 	}

};

Blockly.smash['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.smash.ORDER_LOGICAL_AND :
      Blockly.smash.ORDER_LOGICAL_OR;
  var argument0 = Blockly.smash.valueToCode(block, 'A', order);
  var argument1 = Blockly.smash.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = '';
    argument1 = '';
  } else {
    // Single missing arguments have no effect on the return value.
    var defaultArgument = (operator == '&&') ? '1' : '';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.smash['logic_negate'] = function(block) {
  // Negation.
  var order = Blockly.smash.ORDER_LOGICAL_NOT;
  var argument0 = Blockly.smash.valueToCode(block, 'BOOL', order) ||
      '1';
  var code = '!' + argument0;
  return [code, order];
};

Blockly.smash['logic_boolean'] = function(block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? '1' : '';
  return [code, Blockly.smash.ORDER_ATOMIC];
};

Blockly.smash['logic_null'] = function(block) {
  // Null data type.
  return ['""', Blockly.smash.ORDER_ATOMIC];
};

Blockly.smash['logic_ternary'] = function(block) {
  // Ternary operator.
  var value_if = Blockly.smash.valueToCode(block, 'IF',
      Blockly.smash.ORDER_CONDITIONAL) || '';
  var value_then = Blockly.smash.valueToCode(block, 'THEN',
      Blockly.smash.ORDER_CONDITIONAL) || '""';
  var value_else = Blockly.smash.valueToCode(block, 'ELSE',
      Blockly.smash.ORDER_CONDITIONAL) || '""';
  var code = value_if + ' ? ' + value_then + ' : ' + value_else;
  return [code, Blockly.smash.ORDER_CONDITIONAL];
};
