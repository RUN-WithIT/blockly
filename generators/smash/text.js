'use strict';

goog.provide('Blockly.smash.texts');

goog.require('Blockly.smash');


Blockly.smash['text'] = function(block) {
  // Text value.
  var code = Blockly.smash.quote_(block.getFieldValue('TEXT'));
  return [code, Blockly.smash.ORDER_ATOMIC];
};

Blockly.smash['text_join'] = function(block) {
  // Create a string made up of any number of elements of any type.
  if (block.itemCount_ == 0) {
    return ['\'\'', Blockly.smash.ORDER_ATOMIC];
  } else if (block.itemCount_ == 1) {
    var element = Blockly.smash.valueToCode(block, 'ADD0',
        Blockly.smash.ORDER_NONE) || '\'\'';
    var code = element;
    return [code, Blockly.smash.ORDER_FUNCTION_CALL];
  } else if (block.itemCount_ == 2) {
    var element0 = Blockly.smash.valueToCode(block, 'ADD0',
        Blockly.smash.ORDER_NONE) || '\'\'';
    var element1 = Blockly.smash.valueToCode(block, 'ADD1',
        Blockly.smash.ORDER_NONE) || '\'\'';
    var code = element0 + ' . ' + element1;
    return [code, Blockly.smash.ORDER_ADDITION];
  } else {
    var elements = new Array(block.itemCount_);
    for (var i = 0; i < block.itemCount_; i++) {
      elements[i] = Blockly.smash.valueToCode(block, 'ADD' + i,
          Blockly.smash.ORDER_COMMA) || '\'\'';
    }
    var code = 'implode(\'\', array(' + elements.join(',') + '))';
    return [code, Blockly.smash.ORDER_FUNCTION_CALL];
  }
};

Blockly.smash['text_append'] = function(block) {
  // Append to a variable in place.
  var varName = Blockly.smash.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var value = Blockly.smash.valueToCode(block, 'TEXT',
      Blockly.smash.ORDER_ASSIGNMENT) || '\'\'';
  return varName + ' .= ' + value + ';\n';
};

Blockly.smash['text_length'] = function(block) {
  // String or array length.
  var functionName = Blockly.smash.provideFunction_(
      'length',
      ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + '($value) {',
       '  if (is_string($value)) {',
       '    return strlen($value);',
       '  } else {',
       '    return count($value);',
       '  }',
       '}']);
  var text = Blockly.smash.valueToCode(block, 'VALUE',
      Blockly.smash.ORDER_NONE) || '\'\'';
  return [functionName + '(' + text + ')', Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['text_isEmpty'] = function(block) {
  // Is the string null or array empty?
  var text = Blockly.smash.valueToCode(block, 'VALUE',
      Blockly.smash.ORDER_NONE) || '\'\'';
  return ['empty(' + text + ')', Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['text_indexOf'] = function(block) {
  // Search the text for a substring.
  var operator = block.getFieldValue('END') == 'FIRST' ?
      'strpos' : 'strrpos';
  var substring = Blockly.smash.valueToCode(block, 'FIND',
      Blockly.smash.ORDER_NONE) || '\'\'';
  var text = Blockly.smash.valueToCode(block, 'VALUE',
      Blockly.smash.ORDER_NONE) || '\'\'';
  if (block.workspace.options.oneBasedIndex) {
    var errorIndex = ' 0';
    var indexAdjustment = ' + 1';
  } else {
    var errorIndex = ' -1';
    var indexAdjustment = '';
  }
  var functionName = Blockly.smash.provideFunction_(
      block.getFieldValue('END') == 'FIRST' ?
          'text_indexOf' : 'text_lastIndexOf',
      ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
          '($text, $search) {',
       '  $pos = ' + operator + '($text, $search);',
       '  return $pos === false ? ' + errorIndex + ' : $pos' +
          indexAdjustment + ';',
       '}']);
  var code = functionName + '(' + text + ', ' + substring + ')';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['text_charAt'] = function(block) {
  // Get letter at index.
  var where = block.getFieldValue('WHERE') || 'FROM_START';
  var textOrder = (where == 'RANDOM') ? Blockly.smash.ORDER_NONE :
      Blockly.smash.ORDER_COMMA;
  var text = Blockly.smash.valueToCode(block, 'VALUE', textOrder) || '\'\'';
  switch (where) {
    case 'FIRST':
      var code = 'substr(' + text + ', 0, 1)';
      return [code, Blockly.smash.ORDER_FUNCTION_CALL];
    case 'LAST':
      var code = 'substr(' + text + ', -1)';
      return [code, Blockly.smash.ORDER_FUNCTION_CALL];
    case 'FROM_START':
      var at = Blockly.smash.getAdjusted(block, 'AT');
      var code = 'substr(' + text + ', ' + at + ', 1)';
      return [code, Blockly.smash.ORDER_FUNCTION_CALL];
    case 'FROM_END':
      var at = Blockly.smash.getAdjusted(block, 'AT', 1, true);
      var code = 'substr(' + text + ', ' + at + ', 1)';
      return [code, Blockly.smash.ORDER_FUNCTION_CALL];
    case 'RANDOM':
      var functionName = Blockly.smash.provideFunction_(
          'text_random_letter',
          ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + '($text) {',
           '  return $text[rand(0, strlen($text) - 1)];',
           '}']);
      code = functionName + '(' + text + ')';
      return [code, Blockly.smash.ORDER_FUNCTION_CALL];
  }
  throw 'Unhandled option (text_charAt).';
};

Blockly.smash['text_getSubstring'] = function(block) {
  // Get substring.
  var text = Blockly.smash.valueToCode(block, 'STRING',
      Blockly.smash.ORDER_FUNCTION_CALL) || '\'\'';
  var where1 = block.getFieldValue('WHERE1');
  var where2 = block.getFieldValue('WHERE2');
  if (where1 == 'FIRST' && where2 == 'LAST') {
    var code = text;
  } else {
    var at1 = Blockly.smash.getAdjusted(block, 'AT1');
    var at2 = Blockly.smash.getAdjusted(block, 'AT2');
    var functionName = Blockly.smash.provideFunction_(
        'text_get_substring',
        ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
            '($text, $where1, $at1, $where2, $at2) {',
         '  if ($where1 == \'FROM_END\') {',
         '    $at1 = strlen($text) - 1 - $at1;',
         '  } else if ($where1 == \'FIRST\') {',
         '    $at1 = 0;',
         '  } else if ($where1 != \'FROM_START\'){',
         '    throw new Exception(\'Unhandled option (text_get_substring).\');',
         '  }',
         '  $length = 0;',
         '  if ($where2 == \'FROM_START\') {',
         '    $length = $at2 - $at1 + 1;',
         '  } else if ($where2 == \'FROM_END\') {',
         '    $length = strlen($text) - $at1 - $at2;',
         '  } else if ($where2 == \'LAST\') {',
         '    $length = strlen($text) - $at1;',
         '  } else {',
         '    throw new Exception(\'Unhandled option (text_get_substring).\');',
         '  }',
         '  return substr($text, $at1, $length);',
         '}']);
    var code = functionName + '(' + text + ', \'' +
        where1 + '\', ' + at1 + ', \'' + where2 + '\', ' + at2 + ')';
  }
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['text_changeCase'] = function(block) {
  // Change capitalization.
  var text = Blockly.smash.valueToCode(block, 'TEXT',
          Blockly.smash.ORDER_NONE) || '\'\'';
  if (block.getFieldValue('CASE') == 'UPPERCASE') {
    var code = 'strtoupper(' + text + ')';
  } else if (block.getFieldValue('CASE') == 'LOWERCASE') {
    var code = 'strtolower(' + text + ')';
  } else if (block.getFieldValue('CASE') == 'TITLECASE') {
    var code = 'ucwords(strtolower(' + text + '))';
  }
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['text_trim'] = function(block) {
  // Trim spaces.
  var OPERATORS = {
    'LEFT': 'ltrim',
    'RIGHT': 'rtrim',
    'BOTH': 'trim'
  };
  var operator = OPERATORS[block.getFieldValue('MODE')];
  var text = Blockly.smash.valueToCode(block, 'TEXT',
      Blockly.smash.ORDER_NONE) || '\'\'';
  return [operator + '(' + text + ')', Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['text_print'] = function(block) {
  // Print statement.
  var msg = Blockly.smash.valueToCode(block, 'TEXT',
      Blockly.smash.ORDER_NONE) || '\'\'';
  return 'echo ' + msg + '\n';
};

Blockly.smash['text_prompt_ext'] = function(block) {
  // Prompt function.
  if (block.getField('TEXT')) {
    // Internal message.
    var msg = Blockly.smash.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    var msg = Blockly.smash.valueToCode(block, 'TEXT',
        Blockly.smash.ORDER_NONE) || '\'\'';
  }
  var code = 'readline(' + msg + ')';
  var toNumber = block.getFieldValue('TYPE') == 'NUMBER';
  if (toNumber) {
    code = 'floatval(' + code + ')';
  }
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['text_prompt'] = Blockly.smash['text_prompt_ext'];
