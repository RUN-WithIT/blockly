
/*
 * Lists in PHP are known to break when non-variables are passed into blocks
 * that require a list. PHP, unlike other languages, passes arrays as reference
 * value instead of value so we are unable to support it to the extent we can
 * for the other languages.
 * For example, a ternary operator with two arrays will return the array by
 * value and that cannot be passed into any of the built-in array functions for
 * PHP (because only variables can be passed by reference).
 * ex:  end(true ? list1 : list2)
 */
'use strict';

goog.provide('Blockly.smash.lists');

goog.require('Blockly.smash');


Blockly.smash['lists_create_empty'] = function(block) {
  // Create an empty list.
  return ['()', Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['lists_create_with'] = function(block) {
  // Create a list with any number of elements of any type.
  var code = new Array(block.itemCount_);
  for (var i = 0; i < block.itemCount_; i++) {
    code[i] = Blockly.smash.valueToCode(block, 'ADD' + i,
        Blockly.smash.ORDER_COMMA) || '';
  }
  code = '(' + code.join(' ') + ')';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['lists_repeat'] = function(block) {
  // Create a list with one element repeated.
  var functionName = Blockly.smash.provideFunction_(
      'lists_repeat',
      ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
       '  array=();',
       '  for ((i=0; i<$2; i++)) ; do',
       '    array=("${array[@]}" $1)',
       '  done',
       '  echo "${array[@]}"',
       '}']);
  var element = Blockly.smash.valueToCode(block, 'ITEM',
      Blockly.smash.ORDER_COMMA) || 'null';
  var repeatCount = Blockly.smash.valueToCode(block, 'NUM',
      Blockly.smash.ORDER_COMMA) || '0';
  var code = '($(' + functionName + ' ' + element + ' ' + repeatCount + '))';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['lists_length'] = function(block) {
  // String or array length.
  var list = Blockly.smash.valueToCode(block, 'VALUE',
      Blockly.smash.ORDER_NONE) || '\'\'';
  list = Blockly.smash.strip$(list);
  return ['"${#' + list + '[@]}"', Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['lists_isEmpty'] = function(block) {
  // Is the string null or array empty?
  var argument0 = Blockly.smash.valueToCode(block, 'VALUE',
      Blockly.smash.ORDER_FUNCTION_CALL) || '()';

  argument0 = Blockly.smash.strip$(argument0);

  return ['$([ "${#' + argument0 + '[@]}" -eq 0 ])', Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['lists_indexOf'] = function(block) {
  // Find an item in the list.
  var argument0 = Blockly.smash.valueToCode(block, 'FIND',
      Blockly.smash.ORDER_NONE) || '\'\'';
  var argument1 = Blockly.smash.valueToCode(block, 'VALUE',
      Blockly.smash.ORDER_MEMBER) || '[]';
  if (block.workspace.options.oneBasedIndex) {
    var errorIndex = '0';
    var indexAdjustment = ' + 1';
  } else {
    var errorIndex = ' - 1';
    var indexAdjustment = '';
  }
  if (block.getFieldValue('END') == 'FIRST') {
    // indexOf
    var functionName = Blockly.smash.provideFunction_(
        'indexOf',
        ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
         '  local haystack=("${!1}")',
         '  local needle=${2}',
         '  for i in "${!haystack[@]}"; do',
         '    if [ "${haystack[$i]}" = "${needle}" ]; then',
         '      echo $((i' + indexAdjustment + '))',
         '      exit 0',
         '    fi',
         '  done',
         '  echo ' + errorIndex,
         '}']);
  } else {
    // lastIndexOf
    var functionName = Blockly.smash.provideFunction_(
        'lastIndexOf',
        ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
         '  local haystack=("${!1}")',
         '  local needle="${2}"',
         '  last=' + errorIndex,
         '  for i in "${!haystack[@]}"; do',
         '    if [ "${haystack[$i]}" = "${needle}" ]; then',
         '      last=$((i' + indexAdjustment + '))',
         '    fi',
         '  done',
         '  echo $last',
         '}']);
  }
  argument1 = Blockly.smash.strip$(argument1);
  var code = '$(' + functionName + ' ' + argument1 + '[@] ' + argument0 + ')';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['lists_getIndex'] = function(block) {
  // Get element at index.
  var mode = block.getFieldValue('MODE') || 'GET';
  var where = block.getFieldValue('WHERE') || 'FROM_START';
  switch (where) {
    case 'FIRST':
      if (mode == 'GET') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_MEMBER) || '()';
        list = Blockly.smash.strip$(list);
        var code = '"${' + list + '[0]}"';
        return [code, Blockly.smash.ORDER_MEMBER];
      } else if (mode == 'GET_REMOVE') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_NONE) || '()';
        list = Blockly.smash.strip$(list);
        var code = '"${'+list + '[0]};" ' +
                list + '=("${' + list + '[@]:1}")';
        return [code, Blockly.smash.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_NONE) || '()';
        list = Blockly.smash.strip$(list);
        return list +'=("${' + list + '[@]:1}")\n';
      }
      break;
    case 'LAST':
      if (mode == 'GET') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_NONE) || '()';
        list = Blockly.smash.strip$(list);
        var code = '"${' + list + '[${#' + list + '[@]}-1]}"';
        return [code, Blockly.smash.ORDER_FUNCTION_CALL];
      } else if (mode == 'GET_REMOVE') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_NONE) || '()';
        list = Blockly.smash.strip$(list);
        var code =  '"${' + list + '[${#' + list + '[@]}-1]}"; ' +
                'unset ' + list + '[${#' + list + '[@]}-1]; ' +
                list + '=("${' + list + '[@]:1}")';
        return [code, Blockly.smash.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_NONE) || '()';
        list = Blockly.smash.strip$(list);
        return  'unset ' + list + '[${#' + list + '[@]}-1]';
      }
      break;
    case 'FROM_START':
      var at = Blockly.smash.getAdjusted(block, 'AT');
      if (mode == 'GET') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_MEMBER) || '()';
        list = Blockly.smash.strip$(list);
        var code = '"${' + list + '[' + at + ']}"';
        return [code, Blockly.smash.ORDER_MEMBER];
      } else if (mode == 'GET_REMOVE') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_COMMA) || '()';
        list = Blockly.smash.strip$(list);
        var code = '"${' + list + '[' + at + ']}";' +
            ' unset ' + list + '[' + at + ']; ' + list + '=("${' + list + '[@]}")';
        return [code, Blockly.smash.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_COMMA) || 'array()';
        list = Blockly.smash.strip$(list);
        return 'unset ' + list + '[' + at + ']; ' + list + '=("${' + list + '[@]}")\n';
      }
      break;
    case 'FROM_END':
      if (mode == 'GET') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_COMMA) || '()';
        var at = Blockly.smash.getAdjusted(block, 'AT', 1, true);
        list = Blockly.smash.strip$(list);
        var code = '"${' + list + '[${#' + list + '[@]}' + at + ']}"';
        return [code, Blockly.smash.ORDER_FUNCTION_CALL];
      } else if (mode == 'GET_REMOVE' || mode == 'REMOVE') {
        var list = Blockly.smash.valueToCode(block, 'VALUE',
                Blockly.smash.ORDER_NONE) || '()';
        var at = Blockly.smash.getAdjusted(block, 'AT', 1, false,
            Blockly.smash.ORDER_SUBTRACTION);
        list = Blockly.smash.strip$(list);

        if (mode == 'GET_REMOVE') {
           var code =  '"${' + list + '[${#' + list + '[@]}-' + at +']}"; ' +
                       'unset ' + list + '[${#' + list + '[@]}' + at + ']; ' +
                       list + '=("${' + list + '[@]}")\n';
           return [code, Blockly.smash.ORDER_FUNCTION_CALL];
        } else if (mode == 'REMOVE') {
          var code = 'unset ' + list + '[${#' + list + '[@]}' + at + ']; ' +
                     list + '=("${' + list + '[@]}")\n';
          return code;
        }
      }
      break;
    case 'RANDOM':
      var list = Blockly.smash.valueToCode(block, 'VALUE',
              Blockly.smash.ORDER_NONE) || '()';
      list = Blockly.smash.strip$(list);
      if (mode == 'GET') {
        var functionName = Blockly.smash.provideFunction_(
            'lists_get_random_item',
            ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
             '  local _name="$1[@]"',
             '  local _l=("${!_name}")',
             '  local i=$(($RANDOM % ${#_l[@]}))',
             '  echo "${_l[$i]}"',
             '  eval "$1=(\\"\\${_l[@]}\\")"',
             '}']);
        code = '$(' + functionName + ' ' + list + ')';
        return [code, Blockly.smash.ORDER_FUNCTION_CALL];
      } else if (mode == 'GET_REMOVE') {
        var functionName = Blockly.smash.provideFunction_(
            'lists_get_remove_random_item',
            ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
             '  local _name="$1[@]"',
             '  local _l=("${!_name}")',
             '  local i=$(($RANDOM % ${#_l[@]}))',
             '  echo "${_l[$i]}"',
             '  unset _l[$i]',
             '  eval "$1=(\\"\\${_l[@]}\\")"',
             '}']);
        code = '$(' + functionName + ' ' + list + ')';
        return [code, Blockly.smash.ORDER_FUNCTION_CALL];
      } else if (mode == 'REMOVE') {
        var functionName = Blockly.smash.provideFunction_(
            'lists_remove_random_item',
            ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
             '  local _name=$1[@]',
             '  local _l=("${!_name}")',
             '  local i=$(($RANDOM % ${#_l[@]}))',
             '  unset _l[$i] ',
             '  eval "$1=(\\"\\${_l[@]}\\")"',
             '}']);
        return '$(' + functionName + ' ' + list + ')\n';
      }
      break;
  }
  throw 'Unhandled combination (lists_getIndex).';
};

Blockly.smash['lists_setIndex'] = function(block) {
  // Set element at index.
  // Note: Until February 2013 this block did not have MODE or WHERE inputs.
  var mode = block.getFieldValue('MODE') || 'GET';
  var where = block.getFieldValue('WHERE') || 'FROM_START';
  var value = Blockly.smash.valueToCode(block, 'TO',
      Blockly.smash.ORDER_ASSIGNMENT) || 'null';

  switch (where) {
    case 'FIRST':
       var list = Blockly.smash.valueToCode(block, 'LIST',
                      Blockly.smash.ORDER_MEMBER) || '()';
              list = Blockly.smash.strip$(list);
      if (mode == 'SET') {
        return list + '[0]=' + value + '\n';
      } else if (mode == 'INSERT') {
        list = Blockly.smash.strip$(list);
        return  list + '=(' + value + ' "${' + list + '[@]}")\n';
      }
      break;
    case 'LAST':
      var list = Blockly.smash.valueToCode(block, 'LIST',
              Blockly.smash.ORDER_COMMA) || '()';
      list = Blockly.smash.strip$(list);
      if (mode == 'SET') {
        return list + '[${#' + list + '[@]} - 1]=' + value + '\n';
      } else if (mode == 'INSERT') {
        return  list + '=("${' + list + '[@]}" ' + value + ')\n';
      }
      break;
    case 'FROM_START':
      var at = Blockly.smash.getAdjusted(block, 'AT');
      var list = Blockly.smash.valueToCode(block, 'LIST',
              Blockly.smash.ORDER_MEMBER) || '()';
      list = Blockly.smash.strip$(list);
      if (mode == 'SET') {
        return list + '[' + at + ']=' + value + '\n';
      } else if (mode == 'INSERT') {
       return  list + '=("${' + list + '[@]:0:' + at + '}" ' + value + ' "${' + list + '[@]:' + at + ':\${#' + list + '[@]}}"' + ')\n';
      }
      break;
    case 'FROM_END':
      var list = Blockly.smash.valueToCode(block, 'LIST',
              Blockly.smash.ORDER_COMMA) || '()';
      list = Blockly.smash.strip$(list);
      var at = Blockly.smash.getAdjusted(block, 'AT', 1);
      if (mode == 'SET') {
        return list + '[${#' + list + '[@]} - ' + at + ']=' + value + '\n';
      } else if (mode == 'INSERT') {
        return  list + '=("${' + list + '[@]:0:${#' + list + '[@]} - ' + at + '}" ' +
            value +
            ' "${' + list + '[@]:${#' + list + '[@]} -' + at + ':${#' + list + '[@]}}")\n';
      }
      break;
    case 'RANDOM':
      var list = Blockly.smash.valueToCode(block, 'LIST',
              Blockly.smash.ORDER_REFERENCE) || '()';
      list = Blockly.smash.strip$(list);
      if (mode == 'SET') {
        return list + '[$(($RANDOM % ${#' + list + '[@]}))]=' + value + '\n';
      } else if (mode == 'INSERT') {
       var functionName = Blockly.smash.provideFunction_(
            'lists_insert_random_item',
            ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
             '  local _name="$1[@]"',
             '  local _l=("${!_name}")',
             '  local value=$2',
             '  local i=$(($RANDOM % ${#_l[@]}))',
             '  _l=("${_l[@]:0:$i}" $value "${_l[@]:$i:${#' + list + '[@]}}")\n',
             '  echo "${_l[@]}"',
             '  eval "$1=(\\"\\${_l[@]}\\")"',
             '}']);
        return list + '=($(' + functionName + ' ' +list +' ' + value + '))\n'
      }
      break;
  }
  throw 'Unhandled combination (lists_setIndex).';
};

Blockly.smash['lists_getSublist'] = function(block) {
  // Get sublist.
   var list = Blockly.smash.valueToCode(block, 'LIST',
       Blockly.smash.ORDER_MEMBER) || '[]';
   var where1 = block.getFieldValue('WHERE1');
   var where2 = block.getFieldValue('WHERE2');
   switch (where1) {
     case 'FROM_START':
       var at1 = Blockly.smash.getAdjusted(block, 'AT1');
       break;
     case 'FROM_END':
       var at1 = Blockly.smash.getAdjusted(block, 'AT1', 1, true);
       at1 = '"${#' +list + '}" ' + at1;
       break;
     case 'FIRST':
       var at1 = 0;
       break;
     default:
       throw 'Unhandled option (lists_getSublist)';
   }
   switch (where2) {
     case 'FROM_START':
       var at2 = Blockly.smash.getAdjusted(block, 'AT2', 1);
       break;
     case 'FROM_END':
       var at2 = Blockly.smash.getAdjusted(block, 'AT2', 0, true);
       at2 = '"${#' +list + '}" ' + at2;
     case 'LAST':
       var at2 = '"${#' +list + '}"';
       break;
     default:
       throw 'Unhandled option (lists_getSublist)';
   }
   var code = '("${' + list + '[@]:' + at1 + ' : ' + at2 + '}")';
   return [code, Blockly.smash.ORDER_MEMBER];
};

Blockly.smash['lists_sort'] = function(block) {
  // Block for sorting a list.
  var list = Blockly.smash.valueToCode(block, 'LIST',
      Blockly.smash.ORDER_COMMA) || '()';
  list = Blockly.smash.strip$(list);
  var direction = block.getFieldValue('DIRECTION');
  var type = block.getFieldValue('TYPE');

  var args = ' '
  if (direction !== '1') {
    args += '-r '
  }

  if (type === 'NUMERIC') {
    args += '-n '
  } else if (type === 'IGNORE_CASE') {
    args += '-f '
  }

  var sortCode = '$(echo "${' + list + '[@]}" | tr " " "\\n" | sort ' + args + ' | tr "\\n" " ")'
  return [sortCode, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['lists_split'] = function(block) {
  // Block for splitting text into a list, or joining a list into text.
  var value_input = Blockly.smash.valueToCode(block, 'INPUT',
      Blockly.smash.ORDER_COMMA);
  var value_delim = Blockly.smash.valueToCode(block, 'DELIM',
      Blockly.smash.ORDER_COMMA) || '\'\'';

  var mode = block.getFieldValue('MODE');
  if (mode == 'SPLIT') {
    if (!value_input) {
      value_input = '\'\'';
    }

    var code = '("${' + value_input + '//' + value_delim + '/ }")'
    return [code, Blockly.smash.ORDER_FUNCTION_CALL];
  } else if (mode == 'JOIN') {
    if (!value_input) {
      value_input = '()';
    }

    var code = '$(printf "%s" "${' + value_input + '[@]/#/' + value_delim + '}")'
    return [code, Blockly.smash.ORDER_FUNCTION_CALL];
  } else {
    throw 'Unknown mode: ' + mode;
  }
};
