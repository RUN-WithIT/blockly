'use strict';

goog.provide('Blockly.smash.math');

goog.require('Blockly.smash');


Blockly.smash['math_number'] = function(block) {
  // Numeric value.
  var code = parseFloat(block.getFieldValue('NUM'));
  if (code == Infinity) {
    code = 'INF';
  } else if (code == -Infinity) {
    code = '-INF';
  }
  return [code, Blockly.smash.ORDER_ATOMIC];
};

Blockly.smash['math_arithmetic'] = function(block) {
  // Basic arithmetic operators, and power.
  var OPERATORS = {
    'ADD': [' + ', Blockly.smash.ORDER_ADDITION],
    'MINUS': [' - ', Blockly.smash.ORDER_SUBTRACTION],
    'MULTIPLY': [' * ', Blockly.smash.ORDER_MULTIPLICATION],
    'DIVIDE': [' / ', Blockly.smash.ORDER_DIVISION],
    'POWER': [' ** ', Blockly.smash.ORDER_POWER]
  };
  var tuple = OPERATORS[block.getFieldValue('OP')];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.smash.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.smash.valueToCode(block, 'B', order) || '0';
  var code = '$((' + argument0 + operator + argument1 + '))';
  return [code, order];
};

Blockly.smash['math_single'] = function(block) {
  // Math operators with single operand.
  var operator = block.getFieldValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = Blockly.smash.valueToCode(block, 'NUM',
        Blockly.smash.ORDER_UNARY_NEGATION) || '0';
    if (arg[0] == '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Blockly.smash.ORDER_UNARY_NEGATION];
  }
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.smash.valueToCode(block, 'NUM',
        Blockly.smash.ORDER_DIVISION) || '0';
  } else {
    arg = Blockly.smash.valueToCode(block, 'NUM',
        Blockly.smash.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'abs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'log(' + arg + ')';
      break;
    case 'EXP':
      code = 'exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'sin(' + arg + ' / 180 * pi())';
      break;
    case 'COS':
      code = 'cos(' + arg + ' / 180 * pi())';
      break;
    case 'TAN':
      code = 'tan(' + arg + ' / 180 * pi())';
      break;
  }
  if (code) {
    return [code, Blockly.smash.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'LOG10':
      code = 'log(' + arg + ') / log(10)';
      break;
    case 'ASIN':
      code = 'asin(' + arg + ') / pi() * 180';
      break;
    case 'ACOS':
      code = 'acos(' + arg + ') / pi() * 180';
      break;
    case 'ATAN':
      code = 'atan(' + arg + ') / pi() * 180';
      break;
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.smash.ORDER_DIVISION];
};

Blockly.smash['math_constant'] = function(block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var CONSTANTS = {
    'PI': ['`echo "scale=5; 4*a(1)" | bc -l`', Blockly.smash.ORDER_ATOMIC],
    'E': ['`echo "scale=5; e(1)" | bc -l`', Blockly.smash.ORDER_ATOMIC],
    'GOLDEN_RATIO': ['`echo "scale=5; (1 + sqrt(5)) / 2" | bc -l`', Blockly.smash.ORDER_DIVISION],
    'SQRT2': ['`echo "scale=5; sqrt(2)" | bc -l`', Blockly.smash.ORDER_ATOMIC],
    'SQRT1_2': ['`echo "scale=5; 1/sqrt(2)" | bc -l`', Blockly.smash.ORDER_ATOMIC],
    'INFINITY': ['INF', Blockly.smash.ORDER_ATOMIC]
  };
  return CONSTANTS[block.getFieldValue('CONSTANT')];
};

Blockly.smash['math_number_property'] = function(block) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.smash.valueToCode(block, 'NUMBER_TO_CHECK',
      Blockly.smash.ORDER_MODULUS) || '0';
  var dropdown_property = block.getFieldValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    var functionName = Blockly.smash.provideFunction_(
        'math_isPrime',
        ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + '{',
         '  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods',
         '  if [ "$1" -eq "2" ] ||[ "$1" -eq "3" ] ',
	 '  then',
         '    echo 1',
	 '    exit 1',
         '  fi',
         '  // False if n is NaN, negative, is 1, or not whole.',
         '  // And false if n is divisible by 2 or 3.',
         '  if [ "$1" =~ ^[0-9]+$ ] || [ "$1" -le "1" ] ||' +
         '  [ "$1" % "1" -ne "0" ] || "$1" % "2" -eq "0" || "$1" % "3" -eq "0"]',
	 '  then',
         '    echo 0',
	 '    exit 1',
         '  fi',
         '  // Check all the numbers of form 6k +/- 1, up to sqrt(n).',
         '  for (($x=6; "$x"<=`echo "sqrt($1)" | bc -q` + 1; $x+=6)); do',
         '    if [ $1 % ($x - 1) -eq  0 ] || [ $1 % ($x + 1) -eq 0 ]; then',
         '      echo 0',
	 '      exit 1',
         '    fi',
         '  done',
         '  echo 0',
         '}']);
    code = functionName + number_to_check;
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = number_to_check + ' % 2 == 0';
      break;
    case 'ODD':
      code = number_to_check + ' % 2 == 1';
      break;
    case 'WHOLE':
      code = 'is_int(' + number_to_check + ')';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY':
      var divisor = Blockly.smash.valueToCode(block, 'DIVISOR',
          Blockly.smash.ORDER_MODULUS) || '0';
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
  }
  return [code, Blockly.smash.ORDER_EQUALITY];
};

Blockly.smash['math_change'] = function(block) {
  // Add to a variable in place.
  var argument0 = Blockly.smash.valueToCode(block, 'DELTA',
      Blockly.smash.ORDER_ADDITION) || '0';
  var varName = Blockly.smash.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' += ' + argument0 + ';\n';
};

// Rounding functions have a single operand.
Blockly.smash['math_round'] = Blockly.smash['math_single'];
// Trigonometry functions have a single operand.
Blockly.smash['math_trig'] = Blockly.smash['math_single'];

Blockly.smash['math_on_list'] = function(block) {
  // Math functions for lists.
  var func = block.getFieldValue('OP');
  var list, code;
  switch (func) {
    case 'SUM':
      list = Blockly.smash.valueToCode(block, 'LIST',
          Blockly.smash.ORDER_FUNCTION_CALL) || 'array()';
      code = 'array_sum(' + list + ')';
      break;
    case 'MIN':
      list = Blockly.smash.valueToCode(block, 'LIST',
          Blockly.smash.ORDER_FUNCTION_CALL) || 'array()';
      code = 'min(' + list + ')';
      break;
    case 'MAX':
      list = Blockly.smash.valueToCode(block, 'LIST',
          Blockly.smash.ORDER_FUNCTION_CALL) || 'array()';
      code = 'max(' + list + ')';
      break;
    case 'AVERAGE':
      var functionName = Blockly.smash.provideFunction_(
          'math_mean',
          ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
              '($myList) {',
           '  return array_sum($myList) / count($myList);',
           '}']);
      list = Blockly.smash.valueToCode(block, 'LIST',
          Blockly.smash.ORDER_NONE) || 'array()';
      code = functionName + '(' + list + ')';
      break;
    case 'MEDIAN':
      var functionName = Blockly.smash.provideFunction_(
          'math_median',
          ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
              '($arr) {',
           '  sort($arr,SORT_NUMERIC);',
           '  return (count($arr) % 2) ? $arr[floor(count($arr)/2)] : ',
           '      ($arr[floor(count($arr)/2)] + $arr[floor(count($arr)/2)' +
              ' - 1]) / 2;',
           '}']);
      list = Blockly.smash.valueToCode(block, 'LIST',
          Blockly.smash.ORDER_NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    case 'MODE':
      // As a list of numbers can contain more than one mode,
      // the returned result is provided as an array.
      // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
      var functionName = Blockly.smash.provideFunction_(
          'math_modes',
          ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
              '($values) {',
           '  if (empty($values)) return array();',
           '  $counts = array_count_values($values);',
           '  arsort($counts); // Sort counts in descending order',
           '  $modes = array_keys($counts, current($counts), true);',
           '  return $modes;',
           '}']);
      list = Blockly.smash.valueToCode(block, 'LIST',
          Blockly.smash.ORDER_NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    case 'STD_DEV':
      var functionName = Blockly.smash.provideFunction_(
          'math_standard_deviation',
          ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
              '($numbers) {',
           '  $n = count($numbers);',
           '  if (!$n) return null;',
           '  $mean = array_sum($numbers) / count($numbers);',
           '  foreach($numbers as $key => $num) $devs[$key] = ' +
              'pow($num - $mean, 2);',
           '  return sqrt(array_sum($devs) / (count($devs) - 1));',
           '}']);
      list = Blockly.smash.valueToCode(block, 'LIST',
              Blockly.smash.ORDER_NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    case 'RANDOM':
      var functionName = Blockly.smash.provideFunction_(
          'math_random_list',
          ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
              '($list) {',
           '  $x = rand(0, count($list)-1);',
           '  return $list[$x];',
           '}']);
      list = Blockly.smash.valueToCode(block, 'LIST',
          Blockly.smash.ORDER_NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    default:
      throw 'Unknown operator: ' + func;
  }
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['math_modulo'] = function(block) {
  // Remainder computation.
  var argument0 = Blockly.smash.valueToCode(block, 'DIVIDEND',
      Blockly.smash.ORDER_MODULUS) || '0';
  var argument1 = Blockly.smash.valueToCode(block, 'DIVISOR',
      Blockly.smash.ORDER_MODULUS) || '0';
  var code = argument0 + ' % ' + argument1;
  return [code, Blockly.smash.ORDER_MODULUS];
};

Blockly.smash['math_constrain'] = function(block) {
  // Constrain a number between two limits.
  var argument0 = Blockly.smash.valueToCode(block, 'VALUE',
      Blockly.smash.ORDER_COMMA) || '0';
  var argument1 = Blockly.smash.valueToCode(block, 'LOW',
      Blockly.smash.ORDER_COMMA) || '0';
  var argument2 = Blockly.smash.valueToCode(block, 'HIGH',
      Blockly.smash.ORDER_COMMA) || 'Infinity';
  var code = 'min(max(' + argument0 + ', ' + argument1 + '), ' +
      argument2 + ')';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['math_random_int'] = function(block) {
  // Random integer between [X] and [Y].
  var argument0 = Blockly.smash.valueToCode(block, 'FROM',
      Blockly.smash.ORDER_COMMA) || '0';
  var argument1 = Blockly.smash.valueToCode(block, 'TO',
      Blockly.smash.ORDER_COMMA) || '0';
  var functionName = Blockly.smash.provideFunction_(
      'math_random_int',
      ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
          '($a, $b) {',
       '  if ($a > $b) {',
       '    return rand($b, $a);',
       '  }',
       '  return rand($a, $b);',
       '}']);
  var code = functionName + '(' + argument0 + ', ' + argument1 + ')';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['math_random_float'] = function(block) {
  // Random fraction between 0 and 1.
  return ['(float)rand()/(float)getrandmax()', Blockly.smash.ORDER_FUNCTION_CALL];
};
