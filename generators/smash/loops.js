'use strict';

goog.provide('Blockly.smash.loops');

goog.require('Blockly.smash');


Blockly.smash['controls_repeat_ext'] = function(block) {
  // Repeat n times.
  if (block.getField('TIMES')) {
    // Internal number.
    var repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    var repeats = Blockly.smash.valueToCode(block, 'TIMES',
        Blockly.smash.ORDER_ASSIGNMENT) || '0';
  }
  var branch = Blockly.smash.statementToCode(block, 'DO');
  branch = Blockly.smash.addLoopTrap(branch, block.id);
  var code = '';
  var loopVar = Blockly.smash.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    var endVar = Blockly.smash.variableDB_.getDistinctName(
        'repeat_end', Blockly.Variables.NAME_TYPE);
    code += endVar + ' = ' + repeats + ';\n';
  }
  code += 'for (' + loopVar + ' = 0; ' +
      loopVar + ' < ' + endVar + '; ' +
      loopVar + '++) {\n' +
      branch + '}\n';
  return code;
};

Blockly.smash['controls_repeat'] = Blockly.smash['controls_repeat_ext'];

Blockly.smash['controls_whileUntil'] = function(block) {
  // Do while/until loop.
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.smash.valueToCode(block, 'BOOL',
      until ? Blockly.smash.ORDER_LOGICAL_NOT :
      Blockly.smash.ORDER_NONE) || 'false';
  var branch = Blockly.smash.statementToCode(block, 'DO');
  branch = Blockly.smash.addLoopTrap(branch, block.id);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while [ ' + argument0 + ' ] ; do\n' + branch + 'done\n';
};

Blockly.smash['controls_for'] = function(block) {
  // For loop.
  var variable0 = Blockly.smash.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.smash.valueToCode(block, 'FROM',
      Blockly.smash.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.smash.valueToCode(block, 'TO',
      Blockly.smash.ORDER_ASSIGNMENT) || '0';
  var increment = Blockly.smash.valueToCode(block, 'BY',
      Blockly.smash.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.smash.statementToCode(block, 'DO');
  branch = Blockly.smash.addLoopTrap(branch, block.id);
  var code;
  if (Blockly.isNumber(argument0) && Blockly.isNumber(argument1) &&
      Blockly.isNumber(increment)) {
    // All arguments are simple numbers.
    var up = parseFloat(argument0) <= parseFloat(argument1);
    code = 'for (' + variable0 + ' = ' + argument0 + '; ' +
        variable0 + (up ? ' <= ' : ' >= ') + argument1 + '; ' +
        variable0;
    var step = Math.abs(parseFloat(increment));
    if (step == 1) {
      code += up ? '++' : '--';
    } else {
      code += (up ? ' += ' : ' -= ') + step;
    }
    code += ') {\n' + branch + '}\n';
  } else {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    var startVar = argument0;
    if (!argument0.match(/^\w+$/) && !Blockly.isNumber(argument0)) {
      startVar = Blockly.smash.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += startVar + ' = ' + argument0 + ';\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !Blockly.isNumber(argument1)) {
      var endVar = Blockly.smash.variableDB_.getDistinctName(
          variable0 + '_end', Blockly.Variables.NAME_TYPE);
      code += endVar + ' = ' + argument1 + ';\n';
    }
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    var incVar = Blockly.smash.variableDB_.getDistinctName(
        variable0 + '_inc', Blockly.Variables.NAME_TYPE);
    code += incVar + ' = ';
    if (Blockly.isNumber(increment)) {
      code += Math.abs(increment) + ';\n';
    } else {
      code += 'abs(' + increment + ');\n';
    }
    code += 'if (' + startVar + ' > ' + endVar + ') {\n';
    code += Blockly.smash.INDENT + incVar + ' = -' + incVar + ';\n';
    code += '}\n';
    code += 'for (' + variable0 + ' = ' + startVar + '; ' +
        incVar + ' >= 0 ? ' +
        variable0 + ' <= ' + endVar + ' : ' +
        variable0 + ' >= ' + endVar + '; ' +
        variable0 + ' += ' + incVar + ') {\n' +
        branch + '}\n';
  }
  return code;
};

Blockly.smash['controls_forEach'] = function(block) {
  // For each loop.
  var variable0 = Blockly.smash.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.smash.valueToCode(block, 'LIST',
      Blockly.smash.ORDER_ASSIGNMENT) || '[]';
  var branch = Blockly.smash.statementToCode(block, 'DO');
  branch = Blockly.smash.addLoopTrap(branch, block.id);
  var code = '';
  code += 'foreach (' + argument0 + ' as ' + variable0 +
      ') {\n' + branch + '}\n';
  return code;
};

Blockly.smash['controls_flow_statements'] = function(block) {
  // Flow statements: continue, break.
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return 'break;\n';
    case 'CONTINUE':
      return 'continue;\n';
  }
  throw 'Unknown flow statement.';
};
