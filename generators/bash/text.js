'use strict';

goog.provide('Blockly.bash.texts');

goog.require('Blockly.bash');


Blockly.bash['text'] = function(block) {
  // Text value.
  var code = Blockly.bash.quote_(block.getFieldValue('TEXT'));
  code = code.replace("!", "\\!")
  code = code.replace("$", "\\$")
  code = code.replace("#", "\\#")
  return [code, Blockly.bash.ORDER_ATOMIC];
};

Blockly.bash['text_join'] = function(block) {
  // Create a string made up of any number of elements of any type.
  if (block.itemCount_ == 0) {
    return ['""', Blockly.bash.ORDER_ATOMIC];
  } else if (block.itemCount_ == 1) {
    var element = Blockly.bash.valueToCode(block, 'ADD0',
        Blockly.bash.ORDER_NONE) || '""';
    var code = element;
    return [code, Blockly.bash.ORDER_FUNCTION_CALL];
  } else if (block.itemCount_ == 2) {
    var element0 = Blockly.bash.valueToCode(block, 'ADD0',
        Blockly.bash.ORDER_NONE) || '""';
    var element1 = Blockly.bash.valueToCode(block, 'ADD1',
        Blockly.bash.ORDER_NONE) || '""';
    var code = '"'+ element0 + element1 + '"';
    return [code, Blockly.bash.ORDER_ADDITION];
  } else {
    var elements = new Array(block.itemCount_);
    for (var i = 0; i < block.itemCount_; i++) {
      elements[i] = Blockly.bash.valueToCode(block, 'ADD' + i,
          Blockly.bash.ORDER_COMMA) || '""';
    }
    var code = elements.join("");
    return [code, Blockly.bash.ORDER_FUNCTION_CALL];
  }
};

Blockly.bash['text_append'] = function(block) {
  // Append to a variable in place.
  var varName = Blockly.bash.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var value = Blockly.bash.valueToCode(block, 'TEXT',
      Blockly.bash.ORDER_ASSIGNMENT) || '""';
  return varName + '="${' + varName + '}"' + value +'\n';
};

Blockly.bash['text_length'] = function(block) {
  var text = Blockly.bash.valueToCode(block, 'VALUE',
      Blockly.bash.ORDER_NONE) || '""';


  return ['`echo ' + text + ' | awk \'{print length}\'`', Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['text_isEmpty'] = function(block) {
  // Is the string null or array empty?
  var text = Blockly.bash.valueToCode(block, 'VALUE',
      Blockly.bash.ORDER_NONE) || '""';
  return ['`[[ !  -z  ' + text + ' ]] && echo 0 || echo 1`', Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['text_indexOf'] = function(block) {
  // Search the text for a substring.
  var substring = Blockly.bash.valueToCode(block, 'FIND',
      Blockly.bash.ORDER_NONE) || '""';
  var text = Blockly.bash.valueToCode(block, 'VALUE',
      Blockly.bash.ORDER_NONE) || '""';

    if (block.getFieldValue('END') == 'FIRST'){
      var op ='${text%%"${search}"*}';
    } else {
      var op ='${text##"${search}"*}';
    }

    var functionName = Blockly.bash.provideFunction_(
        block.getFieldValue('END') == 'FIRST' ?
            'text_indexOf' : 'text_lastIndexOf',
        ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
         '  text="${1}"',
         '  search="${2}"',
         '  pfix=' + op,
         '  pos=${#pfix}',
         '  echo $pos',
         '}']);
  var code = '`' + functionName + ' "' + text + '" ' + substring + '`';
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['text_charAt'] = function(block) {
  // Get letter at index.
  var where = block.getFieldValue('WHERE') || 'FROM_START';
  var textOrder = (where == 'RANDOM') ? Blockly.bash.ORDER_NONE :
      Blockly.bash.ORDER_COMMA;
  var text = Blockly.bash.valueToCode(block, 'VALUE', textOrder) || '\'\'';
  text = Blockly.bash.strip$(text);

  switch (where) {
    case 'FIRST':
      var code = '${' + text + ':0:1}';
      return [code, Blockly.bash.ORDER_FUNCTION_CALL];
    case 'LAST':
      var code = '${' + text + ':(-1):1}';
      return [code, Blockly.bash.ORDER_FUNCTION_CALL];
    case 'FROM_START':
      var at = Blockly.bash.getAdjusted(block, 'AT');
      var code = '${' + text + ':' + at + ':1}';
      return [code, Blockly.bash.ORDER_FUNCTION_CALL];
    case 'FROM_END':
      var at = Blockly.bash.getAdjusted(block, 'AT', 1, true);
      var code = '${' + text + ':(' + at + '):1}';
      return [code, Blockly.bash.ORDER_FUNCTION_CALL];
    case 'RANDOM':
      var functionName = Blockly.bash.provideFunction_(
          'text_random_letter',
          ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
           '  local _t="${1}"',
           '  local i=$(($RANDOM % ${#_t}))',
           '  echo ${text:$i:1};',
           '}']);
      code = '`' + functionName + ' ' + text + '`';
      return [code, Blockly.bash.ORDER_FUNCTION_CALL];
  }
  throw 'Unhandled option (text_charAt).';
};

Blockly.bash['text_getSubstring'] = function(block) {
  // Get substring.
  var text = Blockly.bash.valueToCode(block, 'STRING',
      Blockly.bash.ORDER_FUNCTION_CALL) || '\'\'';
  var where1 = block.getFieldValue('WHERE1');
  var where2 = block.getFieldValue('WHERE2');
  if (where1 == 'FIRST' && where2 == 'LAST') {
    var code = text;
  } else {
    var at1 = Blockly.bash.getAdjusted(block, 'AT1');
    var at2 = Blockly.bash.getAdjusted(block, 'AT2');
    var functionName = Blockly.bash.provideFunction_(
        'text_get_substring',
        ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
         '  text="${1}"',
         '  where1="${2}"',
         '  at1="${3}"',
         '  where2="${4}"',
         '  at2="${5}"',
         '  if [ $where1 == FROM_END ]; then',
         '    at1=$((${#text} - 1 - $at1))',
         '  elif [ $where1 == FIRST ]; then',
         '    at1=0',
         '  elif [ $where1 != FROM_START ]; then',
         '    exit 1',
         '  fi',
         '  length=0',
         '  if [ $where2 == FROM_START ]; then',
         '    length=$(($at2 - $at1 + 1))',
         '  elif [ $where2 == FROM_END ]; then',
         '    length=$((${#text} - $at1 - $at2))',
         '  elif [ $where2 == LAST ]; then',
         '    length=$((${#text} - $at1))',
         '  else',
         '    exit 1',
         '  fi',
         '  echo ${text:$at1:$length}',
         '}']);
    var code = '`' + functionName + ' ' + text + ' "' +
        where1 + '" ' + at1 + ' "' + where2 + '" ' + at2 + '`';
  }
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['text_changeCase'] = function(block) {
  // Change capitalization.
  var text = Blockly.bash.valueToCode(block, 'TEXT',
          Blockly.bash.ORDER_NONE) || '\'\'';
  if (block.getFieldValue('CASE') == 'UPPERCASE') {
    var code = '`echo ' + text + ' | tr \'[:lower:]\'  \'[:upper:]\'`';
  } else if (block.getFieldValue('CASE') == 'LOWERCASE') {
     var code = '`echo ' + text + ' | tr \'[:upper:]\' \'[:lower:]\'`';
  } else if (block.getFieldValue('CASE') == 'TITLECASE') {
    var code = '`echo ' + text + ' | awk \'{for(j=1;j<=NF;j++){ $j=toupper(substr($j,1,1)) tolower(substr($j,2)) }}1\'`';
  }
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['text_trim'] = function(block) {
  // Trim spaces.
  var OPERATORS = {
    'LEFT': ' | sed -e \'s/^[ \\t]*//\'',
    'RIGHT': ' | sed \'s/[ \\t]*$//\'',
    'BOTH': ' | sed \'s/^[ \\t]*//;s/[ \\t]*$//\''
  };
  var operator = OPERATORS[block.getFieldValue('MODE')];
  var text = Blockly.bash.valueToCode(block, 'TEXT',
      Blockly.bash.ORDER_NONE) || '\'\'';
  return ['`echo '+ text + operator + '`', Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['text_print'] = function(block) {
  // Print statement.
  var msg = Blockly.bash.valueToCode(block, 'TEXT',
      Blockly.bash.ORDER_NONE) || '\'\'';
  return 'echo ' + msg + '\n';
};

Blockly.bash['text_prompt_ext'] = function(block) {
  // Prompt function.
  if (block.getField('TEXT')) {
    // Internal message.
    var msg = Blockly.bash.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    var msg = Blockly.bash.valueToCode(block, 'TEXT',
        Blockly.bash.ORDER_NONE) || '""';
  }
  // TODO allow for prompt message to be displayed
  var code = '`read temp; echo $temp`';

  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['text_prompt'] = Blockly.bash['text_prompt_ext'];
