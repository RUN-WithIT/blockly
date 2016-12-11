'use strict';

goog.provide('Blockly.smash');

goog.require('Blockly.Generator');


/**
 * smash code generator.
 * @type {!Blockly.Generator}
 */
Blockly.smash = new Blockly.Generator('smash');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.smash.addReservedWords(
        // http://php.net/manual/en/reserved.keywords.php
    '__halt_compiler,abstract,and,array,as,break,callable,case,catch,class,' +
    'clone,const,continue,declare,default,die,do,echo,else,elseif,empty,' +
    'enddeclare,endfor,endforeach,endif,endswitch,endwhile,eval,exit,extends,' +
    'final,for,foreach,function,global,goto,if,implements,include,' +
    'include_once,instanceof,insteadof,interface,isset,list,namespace,new,or,' +
    'print,private,protected,public,require,require_once,return,static,' +
    'switch,throw,trait,try,unset,use,var,while,xor,' +
        // http://php.net/manual/en/reserved.constants.php
    'PHP_VERSION,PHP_MAJOR_VERSION,PHP_MINOR_VERSION,PHP_RELEASE_VERSION,' +
    'PHP_VERSION_ID,PHP_EXTRA_VERSION,PHP_ZTS,PHP_DEBUG,PHP_MAXPATHLEN,' +
    'PHP_OS,PHP_SAPI,PHP_EOL,PHP_INT_MAX,PHP_INT_SIZE,DEFAULT_INCLUDE_PATH,' +
    'PEAR_INSTALL_DIR,PEAR_EXTENSION_DIR,PHP_EXTENSION_DIR,PHP_PREFIX,' +
    'PHP_BINDIR,PHP_BINARY,PHP_MANDIR,PHP_LIBDIR,PHP_DATADIR,PHP_SYSCONFDIR,' +
    'PHP_LOCALSTATEDIR,PHP_CONFIG_FILE_PATH,PHP_CONFIG_FILE_SCAN_DIR,' +
    'PHP_SHLIB_SUFFIX,E_ERROR,E_WARNING,E_PARSE,E_NOTICE,E_CORE_ERROR,' +
    'E_CORE_WARNING,E_COMPILE_ERROR,E_COMPILE_WARNING,E_USER_ERROR,' +
    'E_USER_WARNING,E_USER_NOTICE,E_DEPRECATED,E_USER_DEPRECATED,E_ALL,' +
    'E_STRICT,__COMPILER_HALT_OFFSET__,TRUE,FALSE,NULL,__CLASS__,__DIR__,' +
    '__FILE__,__FUNCTION__,__LINE__,__METHOD__,__NAMESPACE__,__TRAIT__'
);

/**
 * Order of operation ENUMs.
 * http://php.net/manual/en/language.operators.precedence.php
 */
Blockly.smash.ORDER_ATOMIC = 0;             // 0 "" ...
Blockly.smash.ORDER_CLONE = 1;              // clone
Blockly.smash.ORDER_NEW = 1;                // new
Blockly.smash.ORDER_MEMBER = 2.1;           // []
Blockly.smash.ORDER_FUNCTION_CALL = 2.2;    // ()
Blockly.smash.ORDER_POWER = 3;              // **
Blockly.smash.ORDER_INCREMENT = 4;          // ++
Blockly.smash.ORDER_DECREMENT = 4;          // --
Blockly.smash.ORDER_BITWISE_NOT = 4;        // ~
Blockly.smash.ORDER_CAST = 4;               // (int) (float) (string) (array) ...
Blockly.smash.ORDER_SUPPRESS_ERROR = 4;     // @
Blockly.smash.ORDER_INSTANCEOF = 5;         // instanceof
Blockly.smash.ORDER_LOGICAL_NOT = 6;        // !
Blockly.smash.ORDER_UNARY_PLUS = 7.1;       // +
Blockly.smash.ORDER_UNARY_NEGATION = 7.2;   // -
Blockly.smash.ORDER_MULTIPLICATION = 8.1;   // *
Blockly.smash.ORDER_DIVISION = 8.2;         // /
Blockly.smash.ORDER_MODULUS = 8.3;          // %
Blockly.smash.ORDER_ADDITION = 9.1;         // +
Blockly.smash.ORDER_SUBTRACTION = 9.2;      // -
Blockly.smash.ORDER_STRING_CONCAT = 9.3;    // .
Blockly.smash.ORDER_BITWISE_SHIFT = 10;     // << >>
Blockly.smash.ORDER_RELATIONAL = 11;        // < <= > >=
Blockly.smash.ORDER_EQUALITY = 12;          // == != === !== <> <=>
Blockly.smash.ORDER_REFERENCE = 13;         // &
Blockly.smash.ORDER_BITWISE_AND = 13;       // &
Blockly.smash.ORDER_BITWISE_XOR = 14;       // ^
Blockly.smash.ORDER_BITWISE_OR = 15;        // |
Blockly.smash.ORDER_LOGICAL_AND = 16;       // &&
Blockly.smash.ORDER_LOGICAL_OR = 17;        // ||
Blockly.smash.ORDER_IF_NULL = 18;           // ??
Blockly.smash.ORDER_CONDITIONAL = 19;       // ?:
Blockly.smash.ORDER_ASSIGNMENT = 20;        // = += -= *= /= %= <<= >>= ...
Blockly.smash.ORDER_LOGICAL_AND_WEAK = 21;  // and
Blockly.smash.ORDER_LOGICAL_XOR = 22;       // xor
Blockly.smash.ORDER_LOGICAL_OR_WEAK = 23;   // or
Blockly.smash.ORDER_COMMA = 24;             // ,
Blockly.smash.ORDER_NONE = 99;              // (...)

/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array.<!Array.<number>>}
 */
Blockly.smash.ORDER_OVERRIDES = [
  // (foo()).bar() -> foo().bar()
  // (foo())[0] -> foo()[0]
  [Blockly.smash.ORDER_MEMBER, Blockly.smash.ORDER_FUNCTION_CALL],
  // (foo[0])[1] -> foo[0][1]
  // (foo.bar).baz -> foo.bar.baz
  [Blockly.smash.ORDER_MEMBER, Blockly.smash.ORDER_MEMBER],
  // !(!foo) -> !!foo
  [Blockly.smash.ORDER_LOGICAL_NOT, Blockly.smash.ORDER_LOGICAL_NOT],
  // a * (b * c) -> a * b * c
  [Blockly.smash.ORDER_MULTIPLICATION, Blockly.smash.ORDER_MULTIPLICATION],
  // a + (b + c) -> a + b + c
  [Blockly.smash.ORDER_ADDITION, Blockly.smash.ORDER_ADDITION],
  // a && (b && c) -> a && b && c
  [Blockly.smash.ORDER_LOGICAL_AND, Blockly.smash.ORDER_LOGICAL_AND],
  // a || (b || c) -> a || b || c
  [Blockly.smash.ORDER_LOGICAL_OR, Blockly.smash.ORDER_LOGICAL_OR]
];

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.smash.init = function(workspace) {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.smash.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.smash.functionNames_ = Object.create(null);

  if (!Blockly.smash.variableDB_) {
    Blockly.smash.variableDB_ =
        new Blockly.Names(Blockly.smash.RESERVED_WORDS_);
  } else {
    Blockly.smash.variableDB_.reset();
  }

  var defvars = [];
  var variables = Blockly.Variables.allVariables(workspace);
  for (var i = 0; i < variables.length; i++) {
    defvars[i] = Blockly.smash.variableDB_.getName(variables[i],
        Blockly.Variables.NAME_TYPE) + '=""';
  }
  Blockly.smash.definitions_['variables'] = defvars.join('\n');
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.smash.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.smash.definitions_) {
    definitions.push(Blockly.smash.definitions_[name]);
  }
  // Clean up temporary data.
  delete Blockly.smash.definitions_;
  delete Blockly.smash.functionNames_;
  Blockly.smash.variableDB_.reset();
  return definitions.join('\n\n') + '\n\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.smash.scrubNakedValue = function(line) {
  return line + '\n';
};

/**
 * Encode a string as a properly escaped bash string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} smash string.
 * @private
 */
Blockly.smash.quote_ = function(string) {
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');
  return '\"' + string + '\"';
};

/**
 * Common tasks for generating smash from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The smash code created for this block.
 * @return {string} smash code with comments and subsequent blocks added.
 * @private
 */
Blockly.smash.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    comment = Blockly.utils.wrap(comment, Blockly.smash.COMMENT_WRAP - 3);
    if (comment) {
      commentCode += Blockly.smash.prefixLines(comment, '# ') + '\n';
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var i = 0; i < block.inputList.length; i++) {
      if (block.inputList[i].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.smash.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.smash.prefixLines(comment, '# ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.smash.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value while taking into account indexing.
 * @param {!Blockly.Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @param {number=} opt_order The highest order acting on this value.
 * @return {string|number}
 */
Blockly.smash.getAdjusted = function(block, atId, opt_delta, opt_negate,
    opt_order) {
  var delta = opt_delta || 0;
  var order = opt_order || Blockly.smash.ORDER_NONE;
  if (block.workspace.options.oneBasedIndex) {
    delta--;
  }
  var defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
  if (delta > 0) {
    var at = Blockly.smash.valueToCode(block, atId,
            Blockly.smash.ORDER_ADDITION) || defaultAtIndex;
  } else if (delta < 0) {
    var at = Blockly.smash.valueToCode(block, atId,
            Blockly.smash.ORDER_SUBTRACTION) || defaultAtIndex;
  } else if (opt_negate) {
    var at = Blockly.smash.valueToCode(block, atId,
            Blockly.smash.ORDER_UNARY_NEGATION) || defaultAtIndex;
  } else {
    var at = Blockly.smash.valueToCode(block, atId, order) ||
        defaultAtIndex;
  }

  if (Blockly.isNumber(at)) {
    // If the index is a naked number, adjust it right now.
    at = parseFloat(at) + delta;
    if (opt_negate) {
      at = -at;
    }
  } else {
    // If the index is dynamic, adjust it in code.
    if (delta > 0) {
      at = at + ' + ' + delta;
      var innerOrder = Blockly.smash.ORDER_ADDITION;
    } else if (delta < 0) {
      at = at + ' - ' + -delta;
      var innerOrder = Blockly.smash.ORDER_SUBTRACTION;
    }
    if (opt_negate) {
      if (delta) {
        at = '-(' + at + ')';
      } else {
        at = '-' + at;
      }
      var innerOrder = Blockly.smash.ORDER_UNARY_NEGATION;
    }
    innerOrder = Math.floor(innerOrder);
    order = Math.floor(order);
    if (innerOrder && order >= innerOrder) {
      at = '(' + at + ')';
    }
  }
  return at;
};
