'use strict';

goog.provide('Blockly.smash.colour');

goog.require('Blockly.smash');


Blockly.smash['colour_picker'] = function(block) {
  // Colour picker.
  var code = '\'' + block.getFieldValue('COLOUR') + '\'';
  return [code, Blockly.smash.ORDER_ATOMIC];
};

Blockly.smash['colour_random'] = function(block) {
  // Generate a random colour.
  var functionName = Blockly.smash.provideFunction_(
      'colour_random',
      ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ + '() {',
       '  return \'#\' . str_pad(dechex(mt_rand(0, 0xFFFFFF)), ' +
          '6, \'0\', STR_PAD_LEFT);',
       '}']);
  var code = functionName + '()';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['colour_rgb'] = function(block) {
  // Compose a colour from RGB components expressed as percentages.
  var red = Blockly.smash.valueToCode(block, 'RED',
      Blockly.smash.ORDER_COMMA) || 0;
  var green = Blockly.smash.valueToCode(block, 'GREEN',
      Blockly.smash.ORDER_COMMA) || 0;
  var blue = Blockly.smash.valueToCode(block, 'BLUE',
      Blockly.smash.ORDER_COMMA) || 0;
  var functionName = Blockly.smash.provideFunction_(
      'colour_rgb',
      ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
          '($r, $g, $b) {',
       '  $r = round(max(min($r, 100), 0) * 2.55);',
       '  $g = round(max(min($g, 100), 0) * 2.55);',
       '  $b = round(max(min($b, 100), 0) * 2.55);',
       '  $hex = \'#\';',
       '  $hex .= str_pad(dechex($r), 2, \'0\', STR_PAD_LEFT);',
       '  $hex .= str_pad(dechex($g), 2, \'0\', STR_PAD_LEFT);',
       '  $hex .= str_pad(dechex($b), 2, \'0\', STR_PAD_LEFT);',
       '  return $hex;',
       '}']);
  var code = functionName + '(' + red + ', ' + green + ', ' + blue + ')';
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};

Blockly.smash['colour_blend'] = function(block) {
  // Blend two colours together.
  var c1 = Blockly.smash.valueToCode(block, 'COLOUR1',
      Blockly.smash.ORDER_COMMA) || '\'#000000\'';
  var c2 = Blockly.smash.valueToCode(block, 'COLOUR2',
      Blockly.smash.ORDER_COMMA) || '\'#000000\'';
  var ratio = Blockly.smash.valueToCode(block, 'RATIO',
      Blockly.smash.ORDER_COMMA) || 0.5;
  var functionName = Blockly.smash.provideFunction_(
      'colour_blend',
      ['function ' + Blockly.smash.FUNCTION_NAME_PLACEHOLDER_ +
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
  return [code, Blockly.smash.ORDER_FUNCTION_CALL];
};
