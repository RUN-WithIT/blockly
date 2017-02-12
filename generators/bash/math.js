'use strict';

goog.provide('Blockly.bash.math');

goog.require('Blockly.bash');


Blockly.bash['math_number'] = function(block) {
  // Numeric value.
  var code = parseFloat(block.getFieldValue('NUM'));
  if (code == Infinity) {
    code = 'INF';
  } else if (code == -Infinity) {
    code = '-INF';
  }
  return [code, Blockly.bash.ORDER_ATOMIC];
};

Blockly.bash['math_arithmetic'] = function(block) {
  // Basic arithmetic operators, and power.
  var OPERATORS = {
    'ADD': [' + ', Blockly.bash.ORDER_ADDITION],
    'MINUS': [' - ', Blockly.bash.ORDER_SUBTRACTION],
    'MULTIPLY': [' * ', Blockly.bash.ORDER_MULTIPLICATION],
    'DIVIDE': [' / ', Blockly.bash.ORDER_DIVISION],
    'POWER': [' ** ', Blockly.bash.ORDER_POWER]
  };
  var tuple = OPERATORS[block.getFieldValue('OP')];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.bash.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.bash.valueToCode(block, 'B', order) || '0';
  var code = '$((' + argument0 + operator + argument1 + '))';
  return [code, order];
};

Blockly.bash['math_single'] = function(block) {
  // Math operators with single operand.
  var operator = block.getFieldValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = Blockly.bash.valueToCode(block, 'NUM',
        Blockly.bash.ORDER_UNARY_NEGATION) || '0';
    if (arg[0] == '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Blockly.bash.ORDER_UNARY_NEGATION];
  }
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.bash.valueToCode(block, 'NUM',
        Blockly.bash.ORDER_DIVISION) || '0';
  } else {
    arg = Blockly.bash.valueToCode(block, 'NUM',
        Blockly.bash.ORDER_NONE) || '0';
  }

  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      var math_abs = Blockly.bash.provideFunction_(
            'math_abs',
            ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
                '[ $1 -lt 0 ] && echo $((- $1)) || echo $1',
             '}']);
      code = '`' + math_abs + ' ' + arg + '`';
      break;
    case 'ROOT':
      code = '`echo "sqrt(' + arg + ')" | bc -l`';
      break;
    case 'LN':
      code = '`echo "l(' + arg + ')" | bc -l`';
      break;
    case 'EXP':
      code = '`echo "e(' + arg + ')" | bc -l`';
      break;
    case 'POW10':
      code = '` echo "10^' + arg + '" | bc -l`';
      break;
    case 'ROUND':
      code = '`printf -v int %.0f "' + arg + '"`';
      break;
    case 'ROUNDUP':
      arg = Blockly.bash.strip$(arg);
      code = '${' + arg + '/.*}';
      break;
    case 'ROUNDDOWN':
      arg = Blockly.bash.strip$(arg);
      code = '$((${' + arg + '/.*} + 1)) ';
      break;
    case 'SIN':
      code = '`echo "s(' + arg + ')" | bc -l`';
      break;
    case 'COS':
      code = '`echo "c(' + arg + ')" | bc -l`';
      break;
    case 'TAN':
      code = '`echo "s(' + arg + ')/c(' + arg + ')" | bc -l`';
      break;
  }
  if (code) {
    return [code, Blockly.bash.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'LOG10':
      code = '`echo "l(' + arg + ') / l(10)" | bc -l`';
      break;
    case 'ASIN':
      var math_asin = Blockly.bash.provideFunction_(
           'math_asin',
           ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
               'if (( $(echo "$1 == 1" | bc -l) ));then',
               '      echo "90"',
               '   elif (( $(echo "$1 < 1" | bc -l) ));then',
               '      echo "scale=3;a(sqrt((1/(1-($1^2)))-1))" | bc -l',
               '   elif (( $(echo "$1 > 1" | bc -l) ));then',
               '      echo "error"',
               '   fi',
            '}']);
      code = '`' + math_asin + ' ' + arg + '`';
      break;
    case 'ACOS':
      var math_acos = Blockly.bash.provideFunction_(
             'math_acos',
             ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
                  'if (( $(echo "$1 == 0" | bc -l) ));then',
                  '      echo "90"',
                  '   elif (( $(echo "$1 <= 1" | bc -l) ));then',
                  '      echo "scale=3;a(sqrt((1/($1^2))-1))" | bc -l',
                  '   elif (( $(echo "$1 > 1" | bc -l) ));then',
                  '      echo "error"',
                  'fi',
              '}']);
      code = '`' + math_acos + ' ' + arg + '`';
      break;
    case 'ATAN':
      code = '`echo "a(' + arg + ')" | bc -l`';
      break;
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.bash.ORDER_DIVISION];
};

Blockly.bash['math_constant'] = function(block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var CONSTANTS = {
    'PI': ['`echo "4*a(1)" | bc -l`', Blockly.bash.ORDER_ATOMIC],
    'E': ['`echo "e(1)" | bc -l`', Blockly.bash.ORDER_ATOMIC],
    'GOLDEN_RATIO': ['`echo "(1 + sqrt(5)) / 2" | bc -l`', Blockly.bash.ORDER_DIVISION],
    'SQRT2': ['`echo "sqrt(2)" | bc -l`', Blockly.bash.ORDER_ATOMIC],
    'SQRT1_2': ['`echo "1/sqrt(2)" | bc -l`', Blockly.bash.ORDER_ATOMIC],
    'INFINITY': ['INF', Blockly.bash.ORDER_ATOMIC]
  };
  return CONSTANTS[block.getFieldValue('CONSTANT')];
};

Blockly.bash['math_number_property'] = function(block) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.bash.valueToCode(block, 'NUMBER_TO_CHECK',
      Blockly.bash.ORDER_MODULUS) || '0';
  var dropdown_property = block.getFieldValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    var functionName = Blockly.bash.provideFunction_(
        'math_isPrime',
        ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + '{',
         '  if [ "$1" -eq "2" ] ||[ "$1" -eq "3" ] ',
	     '  then',
         '    echo 1',
	     '    exit 1',
         '  fi',
         '  if [ "$1" =~ ^[0-9]+$ ] || [ "$1" -le "1" ] ||' +
         '  [ "$1" % "1" -ne "0" ] || "$1" % "2" -eq "0" || "$1" % "3" -eq "0"]',
	     '  then',
         '    echo 0',
	     '    exit 1',
         '  fi',
         '  for (($x=6; "$x"<=`echo "sqrt($1)" | bc -q` + 1; $x+=6)); do',
         '    if [ $1 % ($x - 1) -eq  0 ] || [ $1 % ($x + 1) -eq 0 ]; then',
         '      echo 0',
	     '      exit 1',
         '    fi',
         '  done',
         '  echo 0',
         '}']);
    code = '`' + functionName + ' ' + number_to_check + '`';
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
      var divisor = Blockly.bash.valueToCode(block, 'DIVISOR',
          Blockly.bash.ORDER_MODULUS) || '0';
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
  }
  return ['[' + code + ']', Blockly.bash.ORDER_EQUALITY];
};

Blockly.bash['math_change'] = function(block) {
  // Add to a variable in place.
  var argument0 = Blockly.bash.valueToCode(block, 'DELTA',
      Blockly.bash.ORDER_ADDITION) || '0';
  var varName = Blockly.bash.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return '(' + varName + ' += ' + argument0 + ')\n';
};

// Rounding functions have a single operand.
Blockly.bash['math_round'] = Blockly.bash['math_single'];
// Trigonometry functions have a single operand.
Blockly.bash['math_trig'] = Blockly.bash['math_single'];

Blockly.bash['math_on_list'] = function(block) {
  // Math functions for lists.
  var func = block.getFieldValue('OP');
  var list, code;
  switch (func) {
    case 'SUM':
      list = Blockly.bash.valueToCode(block, 'LIST',
          Blockly.bash.ORDER_FUNCTION_CALL) || '()';
      list = Blockly.smash.strip$(list);

      var math_sum_list = Blockly.bash.provideFunction_(
             'math_sum_list',
             ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
                 'local _name="$1[@]"',
                 'local _l=("${!_name}")',
                 'local a=0',
                 'for i in ${_l[@]}; do',
                 '   ((a+=i))',
                 'done',
                 'echo $a',
              '}']);
      code = '`' + math_sum_list + ' ' + list + '`';
      break;
    case 'MIN':
      list = Blockly.bash.valueToCode(block, 'LIST',
          Blockly.bash.ORDER_FUNCTION_CALL) || '()';
      list = Blockly.smash.strip$(list);

      var math_min_list = Blockly.bash.provideFunction_(
           'math_min_list',
           ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
               'local _name="$1[@]"',
               'local _l=("${!_name}")',
               'local min=${_l[0]}',
               'for i in ${_l[@]}; do',
               '   if [[ $i -lt $min ]]; then',
               '        min=$i',
               '   fi',
               'done',
               'echo ${min}',
            '}']);
      code = '`' + math_min_list + ' ' + list + '`';
      break;
    case 'MAX':
      list = Blockly.bash.valueToCode(block, 'LIST',
          Blockly.bash.ORDER_FUNCTION_CALL) || '()';
      list = Blockly.smash.strip$(list);

      var math_min_list = Blockly.bash.provideFunction_(
             'math_max_list',
             ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
                 'local _name="$1[@]"',
                 'local _l=("${!_name}")',
                 'local max=${_l[0]}',
                 'for i in ${_l[@]}; do',
                 '   if [[ $i -lg $max ]]; then',
                 '        max=$i',
                 '   fi',
                 'done',
                 'echo ${max}',
              '}']);
      code = '`' + math_max_list + ' ' + list + '`';
      break;
    case 'AVERAGE':
      var functionName = Blockly.bash.provideFunction_(
          'math_mean',
          ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
           '  local _name="$1[@]"',
           '  local _l=("${!_name}")',
           '  local sum=`array_sum $_name`',
           '  echo  `echo "$sum / ${#_l[@]}" | bc -l`',
           '}']);
      list = Blockly.bash.valueToCode(block, 'LIST',
          Blockly.bash.ORDER_NONE) || '()';
      code = functionName + '(' + list + ')';
      break;
    case 'MEDIAN':
      var functionName = Blockly.bash.provideFunction_(
          'math_median',
          ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ +

           '}']);
      list = Blockly.bash.valueToCode(block, 'LIST',
          Blockly.bash.ORDER_NONE) || '[]';
      code = functionName + ' ' + list;
      break;
    case 'MODE':
      // As a list of numbers can contain more than one mode,
      // the returned result is provided as an array.
      // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
      var functionName = Blockly.bash.provideFunction_(
          'math_modes',
          ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {'

           '}']);
      list = Blockly.bash.valueToCode(block, 'LIST',
          Blockly.bash.ORDER_NONE) || '[]';
      code = functionName + ' ' + list;
      break;
    case 'STD_DEV':
      var functionName = Blockly.bash.provideFunction_(
          'math_standard_deviation',
          ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',

           '}']);
      list = Blockly.bash.valueToCode(block, 'LIST',
              Blockly.bash.ORDER_NONE) || '[]';
      code = functionName + '(' + list + ')';
      break;
    case 'RANDOM':
      var functionName = Blockly.bash.provideFunction_(
          'math_random_list',
          ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',

           '}']);
      list = Blockly.bash.valueToCode(block, 'LIST',
          Blockly.bash.ORDER_NONE) || '[]';
      code = functionName + ' ' + list;
      break;
    default:
      throw 'Unknown operator: ' + func;
  }
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['math_modulo'] = function(block) {
  // Remainder computation.
  var argument0 = Blockly.bash.valueToCode(block, 'DIVIDEND',
      Blockly.bash.ORDER_MODULUS) || '0';
  var argument1 = Blockly.bash.valueToCode(block, 'DIVISOR',
      Blockly.bash.ORDER_MODULUS) || '0';
  var code = '$((' + argument0 + ' % ' + argument1 + '))';
  return [code, Blockly.bash.ORDER_MODULUS];
};

Blockly.bash['math_constrain'] = function(block) {
  // Constrain a number between two limits.
  var argument0 = Blockly.bash.valueToCode(block, 'VALUE',
      Blockly.bash.ORDER_COMMA) || '0';
  var argument1 = Blockly.bash.valueToCode(block, 'LOW',
      Blockly.bash.ORDER_COMMA) || '0';
  var argument2 = Blockly.bash.valueToCode(block, 'HIGH',
      Blockly.bash.ORDER_COMMA) || 'Infinity';


  var code = ''
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['math_random_int'] = function(block) {
  // Random integer between [X] and [Y].
  var argument0 = Blockly.bash.valueToCode(block, 'FROM',
      Blockly.bash.ORDER_COMMA) || '0';
  var argument1 = Blockly.bash.valueToCode(block, 'TO',
      Blockly.bash.ORDER_COMMA) || '0';

  var code = '$(((' + argument0 + ' + $RANDOM) % ' + argument1 + '))'

  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['math_random_float'] = function(block) {
  // Random fraction between 0 and 1.
  return ['`awk -v "seed=$RANDOM"  \'BEGIN { srand(seed); printf("%.5f\n", rand()) }\'`', Blockly.bash.ORDER_FUNCTION_CALL];
};
