'use strict';

goog.provide('Blockly.bash.colour');

goog.require('Blockly.bash');


Blockly.bash['colour_picker'] = function(block) {
  // Colour picker.
  var code = '\'' + block.getFieldValue('COLOUR') + '\'';
  return [code, Blockly.bash.ORDER_ATOMIC];
};

Blockly.bash['colour_random'] = function(block) {
   //if this breaks add LC_CTYPE=C
  var code = `cat /dev/urandom | tr -dc 'A-F0-9' | fold -w 6 | head -n 1`
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['colour_rgb'] = function(block) {
  // Compose a colour from RGB components expressed as percentages.
  var red = Blockly.bash.valueToCode(block, 'RED',
      Blockly.bash.ORDER_COMMA) || 0;
  var green = Blockly.bash.valueToCode(block, 'GREEN',
      Blockly.bash.ORDER_COMMA) || 0;
  var blue = Blockly.bash.valueToCode(block, 'BLUE',
      Blockly.bash.ORDER_COMMA) || 0;
  var functionName = Blockly.bash.provideFunction_(
      'colour_rgb',
      ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ + ' {',
       '  r=`mathContrain $1 0 100`',
       '  g=`mathContrain $2 0 100`',
       '  b=`mathContrain $3 0 100`',
       '  r=`echo "$r * 2.55" | bc `',
       '  g=`echo "$g * 2.55" | bc `',
       '  b=`echo "$b * 2.55" | bc `',
       '  r=`printf "%02x\\n" ${r/.*}`',
       '  g=`printf "%02x\\n" ${g/.*}`',
       '  b=`printf "%02x\\n" ${b/.*}`',
       '  echo "#${r}${g}${b}"',
       '}']);
  var code = functionName + '(' + red + ', ' + green + ', ' + blue + ')';
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};

Blockly.bash['colour_blend'] = function(block) {
  // Blend two colours together.
  var c1 = Blockly.bash.valueToCode(block, 'COLOUR1',
      Blockly.bash.ORDER_COMMA) || '\'#000000\'';
  var c2 = Blockly.bash.valueToCode(block, 'COLOUR2',
      Blockly.bash.ORDER_COMMA) || '\'#000000\'';
  var ratio = Blockly.bash.valueToCode(block, 'RATIO',
      Blockly.bash.ORDER_COMMA) || 0.5;
  var functionName = Blockly.bash.provideFunction_(
      'colour_blend',
      ['function ' + Blockly.bash.FUNCTION_NAME_PLACEHOLDER_ +
          '($c1, $c2, $ratio) {',
       '  $ratio = max(min($ratio, 1), 0);',
       '  $r1 = hexdec(substr($c1, 1, 2));',
       '  $g1 = hexdec(substr($c1, 3, 2));',
       '  $b1 = hexdec(substr($c1, 5, 2));',
       '  $r2 = hexdec(substr($c2, 1, 2));',
       '  $g2 = hexdec(substr($c2, 3, 2));',
       '  $b2 = hexdec(substr($c2, 5, 2));',
       '  $r = round($r1 * (1 - $ratio) + $r2 * $ratio);',
       '  $g = round($g1 * (1 - $ratio) + $g2 * $ratio);',
       '  $b = round($b1 * (1 - $ratio) + $b2 * $ratio);',
       '  $hex = \'#\';',
       '  $hex .= str_pad(dechex($r), 2, \'0\', STR_PAD_LEFT);',
       '  $hex .= str_pad(dechex($g), 2, \'0\', STR_PAD_LEFT);',
       '  $hex .= str_pad(dechex($b), 2, \'0\', STR_PAD_LEFT);',
       '  return $hex;',
       '}']);
  var code = functionName + '(' + c1 + ', ' + c2 + ', ' + ratio + ')';
  return [code, Blockly.bash.ORDER_FUNCTION_CALL];
};
