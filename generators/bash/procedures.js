'use strict';

goog.provide('Blockly.bash.procedures');

goog.require('Blockly.bash');

Blockly.bash['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.

  var funcName = Blockly.bash.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.bash.statementToCode(block, 'STACK');
  if (Blockly.bash.STATEMENT_PREFIX) {
    branch = Blockly.bash.prefixLines(
        Blockly.bash.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + block.id + '\''), Blockly.bash.INDENT) + branch;
  }
  if (Blockly.bash.INFINITE_LOOP_TRAP) {
    branch = Blockly.bash.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + block.id + '\'') + branch;
  }
  var returnValue = Blockly.bash.valueToCode(block, 'RETURN',
      Blockly.bash.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  echo ' + returnValue + ';\n';
  }
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.bash.variableDB_.getName(block.arguments_[i],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'function ' + funcName + ' {\n' +
      branch + returnValue + '}';
  code = Blockly.bash.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.bash.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.bash['procedures_defnoreturn'] =
    Blockly.bash['procedures_defreturn'];

Blockly.bash['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.bash.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.bash.valueToCode(block, 'ARG' + i,
        Blockly.bash.ORDER_COMMA) || 'null';
  }
  var code = '`' + funcName + args.join(' ') + '`';
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.bash.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.bash.valueToCode(block, 'ARG' + i,
        Blockly.bash.ORDER_COMMA) || '';
  }
  var code = funcName +  args.join(' ') + '\n';
  return code;
};

Blockly.bash['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.bash.valueToCode(block, 'CONDITION',
      Blockly.bash.ORDER_NONE) || 'false';
  var code = 'if [ ' + condition + ' ]; then\n';
  if (block.hasReturnValue_) {
    var value = Blockly.bash.valueToCode(block, 'VALUE',
        Blockly.bash.ORDER_NONE) || '';
    code += '  echo ' + value + '\n';
    code += '  exit 0 \n';
  } else {
    code += '  exit 0 \n';
  }
  code += 'fi\n';
  return code;
};
