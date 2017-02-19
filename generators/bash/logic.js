'use strict';

goog.provide('Blockly.bash.logic');

goog.require('Blockly.bash');


Blockly.bash['controls_if'] = function(block) {
  // If/elseif/else condition.
  var n = 0;
  var argument = Blockly.bash.valueToCode(block, 'IF' + n,
      Blockly.bash.ORDER_NONE) || '';

  if (argument.indexOf('[') === -1 || argument.indexOf(']') === -1) {
    argument = '[ ' + argument + ' ]';
  }


  var branch = Blockly.bash.statementToCode(block, 'DO' + n);
  var code = 'if ' + argument + ' ; then \n' + branch;
  for (n = 1; n <= block.elseifCount_; n++) {
    argument = Blockly.bash.valueToCode(block, 'IF' + n,
        Blockly.bash.ORDER_NONE) || '';
    branch = Blockly.bash.statementToCode(block, 'DO' + n);
    code += ' elif ' + argument + ' ; then\n' + branch;
  }
  if (block.elseCount_) {
    branch = Blockly.bash.statementToCode(block, 'ELSE');
    code += ' else \n' + branch ;
  }
  return code + 'fi\n';
};

Blockly.bash['logic_compare'] = function(block) {
    // Comparison operator.
    var argument0 = Blockly.bash.valueToCode(block, 'A', order) || '0';
    var argument1 = Blockly.bash.valueToCode(block, 'B', order) || '0';

    argument0 = isNaN(Number(argument0)) ? argument0 : Number(argument0);
    argument1 = isNaN(Number(argument1)) ? argument1 : Number(argument1);
    //if both args are variables
    if ((typeof argument0 == "string" && argument0.charAt(0) == '$') &&
        (typeof argument1 == "string" && argument1.charAt(0) == '$')) {
            var OPERATORS = {
                            'EQ': '==',
                            'NEQ': '!=',
                            'LT': '-lt',
                            'LTE': '-le',
                            'GT': '-gt',
                            'GTE': '-ge'
                        };
    //if comparing to a string
    } else if ((typeof argument0 == "string" && argument0.charAt(0) != '$') ||
     	(typeof argument1 == "string" && argument1.charAt(0) != '$')) {
     	    var OPERATORS = {
                'EQ': '==',
                'NEQ': '!=',
                'LT': '\\<',
                'LTE': '\\<=',
                'GT': '\\>',
                'GTE': '\\>='
     	    };
    //if comparing to a number
    } else if (!isNaN(argument0) || !isNaN(argument1)) {

        var OPERATORS = {
            'EQ': '-eq',
            'NEQ': '-ne',
            'LT': '-lt',
            'LTE': '-le',
            'GT': '-gt',
            'GTE': '-ge'
        };
    }

    var operator = OPERATORS[block.getFieldValue('OP')];
    var order = (operator == OPERATORS.EQ || operator == OPERATORS.NEQ) ?
    Blockly.bash.ORDER_EQUALITY : Blockly.bash.ORDER_RELATIONAL;


    var code = '[ ' + argument0  + ' ' + operator + ' ' + argument1 + ' ]';
    return [code, order];

};

Blockly.bash['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.bash.ORDER_LOGICAL_AND :
      Blockly.bash.ORDER_LOGICAL_OR;
  var argument0 = Blockly.bash.valueToCode(block, 'A', order);
  var argument1 = Blockly.bash.valueToCode(block, 'B', order);
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

Blockly.bash['logic_negate'] = function(block) {
  // Negation.
  var order = Blockly.bash.ORDER_LOGICAL_NOT;
  var argument0 = Blockly.bash.valueToCode(block, 'BOOL', order) ||
      '1';
  var code = '!' + argument0;
  return [code, order];
};

Blockly.bash['logic_boolean'] = function(block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? '1' : '';
  return [code, Blockly.bash.ORDER_ATOMIC];
};

Blockly.bash['logic_null'] = function(block) {
  // Null data type.
  return ['""', Blockly.bash.ORDER_ATOMIC];
};

Blockly.bash['logic_ternary'] = function(block) {
  // Ternary operator.
  var value_if = Blockly.bash.valueToCode(block, 'IF',
      Blockly.bash.ORDER_CONDITIONAL) || '';
  var value_then = Blockly.bash.valueToCode(block, 'THEN',
      Blockly.bash.ORDER_CONDITIONAL) || '""';
  var value_else = Blockly.bash.valueToCode(block, 'ELSE',
      Blockly.bash.ORDER_CONDITIONAL) || '""';
  var code = '`[ ' + value_if + ' ] && echo ' + value_then + ' || echo ' + value_else + '`';
  return [code, Blockly.bash.ORDER_CONDITIONAL];
};
