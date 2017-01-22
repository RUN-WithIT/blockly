'use strict';

goog.provide('Blockly.bash.loops');

goog.require('Blockly.bash');


Blockly.bash['controls_repeat_ext'] = function(block) {
  // Repeat n times.
  if (block.getField('TIMES')) {
    // Internal number.
    var repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    var repeats = Blockly.bash.valueToCode(block, 'TIMES',
        Blockly.bash.ORDER_ASSIGNMENT) || '0';
  }
  var branch = Blockly.bash.statementToCode(block, 'DO');
  branch = Blockly.bash.addLoopTrap(branch, block.id);
  var code = '';
  var loopVar = Blockly.bash.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    var endVar = Blockly.bash.variableDB_.getDistinctName(
        'repeat_end', Blockly.Variables.NAME_TYPE);
    code += endVar + ' = ' + repeats + ';\n';
  }
  code += 'for ((' + loopVar + '=0; ' +
      loopVar + '<' + endVar + '; ' +
      loopVar + '++)) ; do\n' +
      branch + 'done\n';
  return code;
};

Blockly.bash['controls_repeat'] = Blockly.bash['controls_repeat_ext'];

Blockly.bash['controls_whileUntil'] = function(block) {
  // Do while/until loop.
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.bash.valueToCode(block, 'BOOL',
      until ? Blockly.bash.ORDER_LOGICAL_NOT :
      Blockly.bash.ORDER_NONE) || 'false';
  var branch = Blockly.bash.statementToCode(block, 'DO');
  branch = Blockly.bash.addLoopTrap(branch, block.id);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while [ ' + argument0 + ' ] ; do\n' + branch + 'done\n';
};

Blockly.bash['controls_for'] = function(block) {
  // For loop.
  var variable0 = Blockly.bash.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.bash.valueToCode(block, 'FROM',
      Blockly.bash.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.bash.valueToCode(block, 'TO',
      Blockly.bash.ORDER_ASSIGNMENT) || '0';
  var increment = Blockly.bash.valueToCode(block, 'BY',
      Blockly.bash.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.bash.statementToCode(block, 'DO');
  branch = Blockly.bash.addLoopTrap(branch, block.id);
  var code;
  if (Blockly.isNumber(argument0) && Blockly.isNumber(argument1) &&
      Blockly.isNumber(increment)) {
    // All arguments are simple numbers.
    var up = parseFloat(argument0) <= parseFloat(argument1);
    code = 'for ((' + variable0 + '=' + argument0 + '; ' +
        variable0 + (up ? '<=' : '>=') + argument1 + '; ' +
        variable0;
    var step = Math.abs(parseFloat(increment));
    if (step == 1) {
      code += up ? '++' : '--';
    } else {
      code += (up ? '+=' : '-=') + step;
    }
    code += ')) ; do\n' + branch + 'done\n';
  } else {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    var startVar = argument0;
    if (!argument0.match(/^\w+$/) && !Blockly.isNumber(argument0)) {
      startVar = Blockly.bash.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += startVar + '=' + argument0 + ';\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !Blockly.isNumber(argument1)) {
      var endVar = "$" + Blockly.bash.variableDB_.getDistinctName(
          variable0 + '_end', Blockly.Variables.NAME_TYPE);
      code += endVar + '=' + argument1 + '\n';
    }
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    var incVar = Blockly.bash.variableDB_.getDistinctName(
        variable0 + '_inc', Blockly.Variables.NAME_TYPE);
    code += incVar + '=';
    if (Blockly.isNumber(increment)) {
      code += Math.abs(increment) + ';\n';
    } else {
      code += 'abs(' + increment + ');\n';
    }
    code += 'if [ $' + startVar + ' -gt ' + endVar + ' ]; then\n';
    code += Blockly.bash.INDENT + incVar + '=-$' + incVar + '\n';
    code += 'fi\n';
    code += 'for ((' + variable0 + '=$' + startVar + '; ' +
        '$([ $' + incVar + ' -gt 0 ] && ' +
        'echo $((' + variable0 + '<=' + endVar + ')) || ' +
        'echo $((' + variable0 + '>=' + endVar + ')) ); ' +
        variable0 + ' += ' + incVar + ')); do\n' +
        branch + 'done\n';
  }
  return code;
};

Blockly.bash['controls_forEach'] = function(block) {
  // For each loop.
  var variable0 = Blockly.bash.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.bash.valueToCode(block, 'LIST',
      Blockly.bash.ORDER_ASSIGNMENT) || '()';
  var branch = Blockly.bash.statementToCode(block, 'DO');
  branch = Blockly.bash.addLoopTrap(branch, block.id);
  var code = '';
  if (argument0.indexOf("(") == 0){
        argument0 = argument0.slice(1,-1)
  } else {
        argument0 = "${" + argument0.slice(1) + "[@]}";
  }

  code += 'for ' + variable0 + ' in ' + argument0 +
      '; do\n' + branch + 'done\n';
  return code;
};

Blockly.bash['controls_flow_statements'] = function(block) {
  // Flow statements: continue, break.
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return 'break\n';
    case 'CONTINUE':
      return 'continue\n';
  }
  throw 'Unknown flow statement.';
};
