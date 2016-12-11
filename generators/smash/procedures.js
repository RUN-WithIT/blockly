'use strict';

goog.provide('Blockly.smash.procedures');

goog.require('Blockly.smash');

Blockly.smash['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  // First, add a 'global' statement for every variable that is not shadowed by
  // a local parameter.
  var globals = [];
  for (var i = 0, varName; varName = block.workspace.variableList[i]; i++) {
    if (block.arguments_.indexOf(varName) == -1) {
      globals.push(Blockly.smash.variableDB_.getName(varName,
          Blockly.Variables.NAME_TYPE));
    }
  }
  globals = globals.length ? '  global ' + globals.join(', ') + ';\n' : '';

  var funcName = Blockly.smash.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.smash.statementToCode(block, 'STACK');
  if (Blockly.smash.STATEMENT_PREFIX) {
    branch = Blockly.smash.prefixLines(
        Blockly.smash.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + block.id + '\''), Blockly.smash.INDENT) + branch;
  }
  if (Blockly.smash.INFINITE_LOOP_TRAP) {
    branch = Blockly.smash.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + block.id + '\'') + branch;
  }
  var returnValue = Blockly.smash.valueToCode(block, 'RETURN',
      Blockly.smash.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  echo ' + returnValue + ';\n';
  }
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.smash.variableDB_.getName(block.arguments_[i],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'function ' + funcName + ' {\n' +
      globals + branch + returnValue + '}';
  code = Blockly.smash.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.smash.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.smash['procedures_defnoreturn'] =
    Blockly.smash['procedures_defreturn'];

Blockly.smash['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.smash.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.smash.valueToCode(block, 'ARG' + i,
        Blockly.smash.ORDER_COMMA) || 'null';
  }
  var code = '$(' + funcName + args.join(' ') + ')';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.smash.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.smash.valueToCode(block, 'ARG' + i,
        Blockly.smash.ORDER_COMMA) || '';
  }
  var code = funcName +  args.join(' ') + '\n';
  return code;
};

Blockly.smash['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.smash.valueToCode(block, 'CONDITION',
      Blockly.smash.ORDER_NONE) || 'false';
  var code = 'if [ ' + condition + ' ]; then\n';
  if (block.hasReturnValue_) {
    var value = Blockly.smash.valueToCode(block, 'VALUE',
        Blockly.smash.ORDER_NONE) || '';
    code += '  echo ' + value + '\n';
    code += '  exit 0 \n';
  } else {
    code += '  exit 0 \n';
  }
  code += 'fi\n';
  return code;
};
